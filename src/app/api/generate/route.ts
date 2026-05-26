import { NextResponse } from "next/server";

import { getCompanyProfileById } from "@/data/company-profiles";
import { mergeCompanyPair } from "@/lib/prompt/merge-company-pair";

import { assertAiGatewayConfigured } from "@/lib/env-server";
import { sanitizeVibeTags } from "@/lib/vibe-tags";
import { buildGenerationPrompt } from "@/lib/prompt/build-generation-prompt";
import { normalizeRenderMode } from "@/lib/screen-type";
import { makeGenerationSlugSnippet } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { getDodoClient, assertDodoEntitlementConfigured } from "@/lib/dodo/client";
import { dispatchGenerationJob } from "@/lib/generation/dispatch-generation";
import { updateGenerationStatus } from "@/lib/generation/db";
import { logGenerationTiming } from "@/lib/generation/timing";

export const runtime = "nodejs";
export const maxDuration = 300;

type GenerateBody = {
  builder?: unknown;
  target?: unknown;
  builderId?: unknown;
  targetId?: unknown;
  extraDetails?: unknown;
  tone?: unknown;
  screenType?: unknown;
  remixParentId?: unknown;
};

function parseProfileId(v: unknown): string | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function parseRemixParentId(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    throw new Error("remixParentId must be a positive integer");
  }
  if (n > Number.MAX_SAFE_INTEGER) throw new Error("remixParentId too large");
  return n;
}

async function assertCompanyDataAvailable(): Promise<void> {
  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("company_profiles")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
}

export async function POST(request: Request) {
  const requestStarted = performance.now();

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let remixParentId: number | null;
  try {
    remixParentId = parseRemixParentId(body.remixParentId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid remixParentId";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const builderId = parseProfileId(body.builderId);
  const targetId = parseProfileId(body.targetId);

  let builderName = String(body.builder ?? "").trim();
  let targetName = String(body.target ?? "").trim();
  let extraDetails = String(body.extraDetails ?? "");
  let builderDefaultVibeTags: string[] = [];

  const mergeStarted = performance.now();
  if (builderId && targetId) {
    try {
      const merged = await mergeCompanyPair(builderId, targetId);
      builderName = merged.builder;
      targetName = merged.target;
      builderDefaultVibeTags = merged.builderDefaultVibeTags;
      const userExtra = String(body.extraDetails ?? "").trim();
      extraDetails = userExtra
        ? `${merged.extraDetails}

Additional notes from user:
${userExtra}`
        : merged.extraDetails;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid profile selection";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } else if (builderId || targetId) {
    return NextResponse.json(
      { error: "Both builderId and targetId are required when using profile ids" },
      { status: 400 },
    );
  }
  logGenerationTiming("api_merge_profiles", performance.now() - mergeStarted, {
    hasProfileIds: Boolean(builderId && targetId),
  });

  const screenTypeRaw =
    typeof body.screenType === "string" ? body.screenType.trim() : "";
  const screenType = normalizeRenderMode(screenTypeRaw || "desktop");

  let prompt: string;
  try {
    prompt = buildGenerationPrompt({
      builder: builderName,
      target: targetName,
      extraDetails,
      tone: typeof body.tone === "string" ? body.tone : "",
      screenType,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid prompt fields";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    assertAiGatewayConfigured();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server misconfiguration";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await assertCompanyDataAvailable();
  } catch {
    return NextResponse.json(
      { error: "Company data unavailable", code: "db_unavailable" },
      { status: 503 },
    );
  }

  const parallelStarted = performance.now();
  const remixParentPromise =
    remixParentId != null
      ? supabase
          .from("generations")
          .select("id")
          .eq("id", remixParentId)
          .eq("visibility", "published")
          .eq("moderation_status", "visible")
          .eq("status", "completed")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

  const dodoMappingPromise = supabase
    .from("dodo_customers")
    .select("customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const builderProfilePromise =
    builderId && builderDefaultVibeTags.length === 0
      ? getCompanyProfileById(builderId)
      : Promise.resolve(null);

  const [remixParentResult, dodoMappingResult, builderProfile] = await Promise.all([
    remixParentPromise,
    dodoMappingPromise,
    builderProfilePromise,
  ]);
  logGenerationTiming("api_parallel_prefetch", performance.now() - parallelStarted);

  if (remixParentId != null) {
    const { data: parent, error: pErr } = remixParentResult;
    if (pErr || !parent) {
      return NextResponse.json(
        { error: "Remix parent not found or not public" },
        { status: 400 },
      );
    }
  }

  const dodoCustomerId = dodoMappingResult.data?.customer_id ?? null;

  if (!dodoCustomerId) {
    return NextResponse.json(
      { error: "Insufficient credits. Please buy a credit pack.", code: "insufficient_credits" },
      { status: 402 },
    );
  }

  const entitlementId = assertDodoEntitlementConfigured();
  const dodoClient = getDodoClient();

  const creditCheckStarted = performance.now();
  let availableCredits = 0;
  try {
    const bal = await dodoClient.creditEntitlements.balances.retrieve(dodoCustomerId, {
      credit_entitlement_id: entitlementId,
    });
    availableCredits = Number(bal.balance ?? "0");
  } catch {
    return NextResponse.json(
      { error: "Unable to verify credits. Please try again.", code: "billing_unavailable" },
      { status: 503 },
    );
  }
  logGenerationTiming("api_credit_check", performance.now() - creditCheckStarted);

  if (!Number.isFinite(availableCredits) || availableCredits <= 0) {
    return NextResponse.json(
      { error: "Insufficient credits. Please top up.", code: "insufficient_credits" },
      { status: 402 },
    );
  }

  if (builderDefaultVibeTags.length === 0 && builderProfile) {
    builderDefaultVibeTags = builderProfile.defaultVibeTags;
  }

  const service = createSupabaseServiceClient();
  const baseSlug = makeGenerationSlugSnippet({
    builder: builderName,
    target: targetName,
  });
  const plannedExt = "png";

  let inserted:
    | {
        id: number;
        slug: string;
      }
    | undefined;

  const insertStarted = performance.now();
  for (let attempt = 0; attempt < 8; attempt++) {
    const slug =
      attempt === 0 ? baseSlug : `${baseSlug.slice(0, 32)}-${attempt}`;
    const objectPath = `${user.id}/${slug}.${plannedExt}`;

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        creator_id: user.id,
        slug,
        builder: builderName,
        target: targetName,
        tone: typeof body.tone === "string" ? body.tone.slice(0, 80) : "",
        vibe_tags: sanitizeVibeTags(builderDefaultVibeTags),
        screen_type: screenType,
        region: "",
        extra_details: extraDetails,
        generated_prompt: prompt,
        image_path: objectPath,
        visibility: "published",
        status: "queued",
        remix_parent_id: remixParentId,
      })
      .select("id, slug")
      .maybeSingle();

    if (!insErr && row) {
      inserted = row;
      break;
    }

    if (insErr?.code === "23505") {
      continue;
    }

    return NextResponse.json(
      { error: "Could not save generation", detail: insErr?.message },
      { status: 500 },
    );
  }
  logGenerationTiming("api_insert_generation", performance.now() - insertStarted);

  if (!inserted) {
    return NextResponse.json(
      { error: "Could not allocate unique slug" },
      { status: 500 },
    );
  }

  const workflowStart = performance.now();
  try {
    const run = await dispatchGenerationJob({
      generationId: inserted.id,
      userId: user.id,
      dodoCustomerId,
      builderId,
    });

    await updateGenerationStatus(inserted.id, {
      status: "queued",
      workflowRunId: run.runId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not start generation";
    await updateGenerationStatus(inserted.id, {
      status: "failed",
      errorMessage: msg,
      completedAt: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Could not start generation workflow", detail: msg },
      { status: 500 },
    );
  }
  logGenerationTiming("api_workflow_start", performance.now() - workflowStart, {
    generationId: inserted.id,
  });

  logGenerationTiming("api_post_total", performance.now() - requestStarted, {
    generationId: inserted.id,
  });

  return NextResponse.json(
    {
      id: inserted.id,
      slug: inserted.slug,
      status: "queued" as const,
      builder: builderName,
      target: targetName,
    },
    { status: 202 },
  );
}
