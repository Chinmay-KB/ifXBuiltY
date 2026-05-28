import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { mergeCompanyPair } from "@/lib/prompt/merge-company-pair";
import { buildGenerationPrompt } from "@/lib/prompt/build-generation-prompt";
import { normalizeRenderMode } from "@/lib/screen-type";
import { getGenerationImagesBucket } from "@/lib/env-server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { scheduleAdminModelTestRunInlineJob } from "@/lib/admin-model-test/dispatch-inline";

export const runtime = "nodejs";
export const maxDuration = 300;

type CreateRunsBody = {
  builder?: unknown;
  target?: unknown;
  builderId?: unknown;
  targetId?: unknown;
  extraDetails?: unknown;
  tone?: unknown;
  screenType?: unknown;
  models?: unknown;
};

function parseProfileId(v: unknown): string | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function parseModels(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const models = v
    .map((m) => (typeof m === "string" ? m.trim() : ""))
    .filter(Boolean);
  const uniq = Array.from(new Set(models));
  return uniq.length > 0 ? uniq : null;
}

export async function GET(request: Request) {
  try {
    await requireSuperadmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(
    200,
    Math.max(1, Number.isFinite(Number(limitRaw)) ? Math.trunc(Number(limitRaw)) : 50),
  );

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("admin_model_test_runs")
    .select(
      "id, created_by, builder, target, tone, screen_type, extra_details, generated_prompt, model, quality, status, error_message, started_at, completed_at, duration_ms, image_path, image_ready, publish_state, published_generation_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load runs", detail: error.message },
      { status: 500 },
    );
  }

  const bucket = getGenerationImagesBucket();
  const signedUrls = await Promise.all(
    (data ?? []).map(async (r) => {
      const path = typeof r.image_path === "string" ? r.image_path.trim() : "";
      if (!path) return { id: r.id, url: null as string | null };
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 10);
      return { id: r.id, url: signed?.signedUrl ?? null };
    }),
  );
  const signedById = new Map(signedUrls.map((s) => [s.id, s.url] as const));

  return NextResponse.json(
    (data ?? []).map((r) => ({
      id: r.id,
      createdBy: r.created_by,
      builder: r.builder,
      target: r.target,
      tone: r.tone,
      screenType: r.screen_type,
      extraDetails: r.extra_details,
      generatedPrompt: r.generated_prompt,
      model: r.model,
      quality: r.quality,
      status: r.status,
      errorMessage: r.error_message,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      durationMs: r.duration_ms,
      imagePath: r.image_path,
      imageUrl: signedById.get(r.id) ?? null,
      imageReady: r.image_ready,
      publishState: r.publish_state,
      publishedGenerationId: r.published_generation_id,
      createdAt: r.created_at,
    })),
  );
}

export async function POST(request: Request) {
  let adminUser;
  try {
    adminUser = await requireSuperadmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }

  let body: CreateRunsBody;
  try {
    body = (await request.json()) as CreateRunsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const builderId = parseProfileId(body.builderId);
  const targetId = parseProfileId(body.targetId);

  let builderName = String(body.builder ?? "").trim();
  let targetName = String(body.target ?? "").trim();
  let extraDetails = String(body.extraDetails ?? "");

  if (builderId && targetId) {
    try {
      const merged = await mergeCompanyPair(builderId, targetId);
      builderName = merged.builder;
      targetName = merged.target;
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

  const screenTypeRaw =
    typeof body.screenType === "string" ? body.screenType.trim() : "";
  const screenType = normalizeRenderMode(screenTypeRaw || "desktop");
  const tone = typeof body.tone === "string" ? body.tone.slice(0, 80) : "";

  const models = parseModels(body.models);
  if (!models) {
    return NextResponse.json(
      { error: 'Field "models" must be a non-empty string array' },
      { status: 400 },
    );
  }

  let prompt: string;
  try {
    prompt = buildGenerationPrompt({
      builder: builderName,
      target: targetName,
      extraDetails,
      tone,
      screenType,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid prompt fields";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const inserts = models.map((model) => ({
    created_by: adminUser.id,
    builder: builderName,
    target: targetName,
    tone,
    screen_type: screenType,
    extra_details: extraDetails,
    generated_prompt: prompt,
    model,
    quality: "high",
    status: "queued",
    publish_state: "draft",
  }));

  const { data: rows, error: insErr } = await supabase
    .from("admin_model_test_runs")
    .insert(inserts)
    .select(
      "id, model, status, publish_state, created_at, builder, target, tone, screen_type, extra_details, generated_prompt",
    );

  if (insErr || !rows) {
    return NextResponse.json(
      { error: "Could not create runs", detail: insErr?.message },
      { status: 500 },
    );
  }

  // Assign deterministic storage path and dispatch jobs.
  const planned = rows.map((r) => ({
    id: r.id as string,
    model: r.model as string,
    status: r.status as string,
    publishState: r.publish_state as string,
    createdAt: r.created_at as string,
  }));

  await Promise.all(
    planned.map((r) =>
      supabase
        .from("admin_model_test_runs")
        .update({ image_path: `${adminUser.id}/admin-model-test/${r.id}.png` })
        .eq("id", r.id),
    ),
  );

  const dispatches = planned.map((r) =>
    scheduleAdminModelTestRunInlineJob({ runId: r.id, userId: adminUser.id }),
  );

  return NextResponse.json(
    {
      runs: planned,
      dispatch: dispatches,
    },
    { status: 202 },
  );
}

