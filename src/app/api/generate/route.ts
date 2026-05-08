import { Buffer } from "node:buffer";

import { generateImage } from "ai";
import { NextResponse } from "next/server";

import { GENERATION_QUOTA_PER_DAY } from "@/lib/constants";
import {
  assertAiGatewayConfigured,
  getGenerationImagesBucket,
} from "@/lib/env-server";
import { buildGenerationPrompt } from "@/lib/prompt/build-generation-prompt";
import { makeGenerationSlugSnippet } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import { getDodoClient, assertDodoEntitlementConfigured } from "@/lib/dodo/client";
export const runtime = "nodejs";

const DEFAULT_GATEWAY_IMAGE_MODEL = "openai/gpt-image-2";

type GenerateBody = {
  builder?: unknown;
  target?: unknown;
  tone?: unknown;
  screenType?: unknown;
  region?: unknown;
  extraDetails?: unknown;
  remixParentId?: unknown;
};

function parseRemixParentId(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    throw new Error("remixParentId must be a positive integer");
  }
  if (n > Number.MAX_SAFE_INTEGER) throw new Error("remixParentId too large");
  return n;
}

function extFromMediaType(mediaType: string): string {
  if (mediaType === "image/png") return "png";
  if (mediaType === "image/jpeg" || mediaType === "image/jpg") return "jpg";
  if (mediaType === "image/webp") return "webp";
  return "png";
}

export async function POST(request: Request) {
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

  let prompt: string;
  try {
    prompt = buildGenerationPrompt({
      builder: String(body.builder ?? ""),
      target: String(body.target ?? ""),
      tone: String(body.tone ?? ""),
      screenType: String(body.screenType ?? ""),
      region: String(body.region ?? ""),
      extraDetails: String(body.extraDetails ?? ""),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid prompt fields";
    const status =
      e instanceof TypeError || e instanceof RangeError ? 400 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  let bucket: string;
  try {
    assertAiGatewayConfigured();
    bucket = getGenerationImagesBucket();
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

  if (remixParentId != null) {
    const { data: parent, error: pErr } = await supabase
      .from("generations")
      .select("id")
      .eq("id", remixParentId)
      .eq("visibility", "published")
      .eq("moderation_status", "visible")
      .maybeSingle();
    if (pErr || !parent) {
      return NextResponse.json(
        { error: "Remix parent not found or not public" },
        { status: 400 },
      );
    }
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: quotaCount, error: quotaErr } = await supabase
    .from("generation_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("event_type", "generation")
    .gte("created_at", dayAgo);

  if (quotaErr) {
    return NextResponse.json(
      { error: "Could not verify generation quota" },
      { status: 500 },
    );
  }
  if ((quotaCount ?? 0) >= GENERATION_QUOTA_PER_DAY) {
    return NextResponse.json(
      { error: "Daily generation limit reached", code: "quota_exceeded" },
      { status: 429 },
    );
  }

  // Dodo Payments: verify prepaid Image Credits before generating
  let dodoCustomerId: string | null = null;
  try {
    const { data: mapping } = await supabase
      .from("dodo_customers")
      .select("customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    dodoCustomerId = mapping?.customer_id ?? null;
  } catch {
    // ignore; handled below
  }

  if (!dodoCustomerId) {
    return NextResponse.json(
      { error: "Insufficient credits. Please buy a credit pack.", code: "insufficient_credits" },
      { status: 402 },
    );
  }

  const entitlementId = assertDodoEntitlementConfigured();
  const dodoClient = getDodoClient();

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

  if (!Number.isFinite(availableCredits) || availableCredits <= 0) {
    return NextResponse.json(
      { error: "Insufficient credits. Please top up.", code: "insufficient_credits" },
      { status: 402 },
    );
  }

  const imageModel =
    process.env.AI_GATEWAY_IMAGE_MODEL?.trim() || DEFAULT_GATEWAY_IMAGE_MODEL;

  let imageBytes: Buffer;
  let uploadContentType: string;
  try {
    const result = await generateImage({
      model: imageModel,
      prompt,
      size: "1024x1024",
      providerOptions: {
        gateway: {
          user: user.id,
          tags: ["feature:generate", "app:ifxbuilty"],
        },
      },
    });

    const file = result.image;
    uploadContentType = file.mediaType;
    imageBytes = Buffer.from(file.uint8Array);
  } catch (e: unknown) {
    const message =
      e && typeof e === "object" && "message" in e
        ? String((e as { message?: unknown }).message)
        : "Image generation failed";
    return NextResponse.json(
      { error: message, code: "gateway_error" },
      { status: 502 },
    );
  }

  if (imageBytes.length === 0) {
    return NextResponse.json(
      { error: "No image data returned", code: "gateway_empty" },
      { status: 502 },
    );
  }

  const service = createSupabaseServiceClient();
  const baseSlug = makeGenerationSlugSnippet({
    builder: String(body.builder ?? ""),
    target: String(body.target ?? ""),
  });

  const ext = extFromMediaType(uploadContentType);

  let inserted:
    | {
        id: number;
        slug: string;
        builder: string;
        target: string;
        tone: string;
        screen_type: string;
        region: string;
        extra_details: string;
        image_path: string | null;
      }
    | undefined;

  for (let attempt = 0; attempt < 8; attempt++) {
    const slug =
      attempt === 0 ? baseSlug : `${baseSlug.slice(0, 32)}-${attempt}`;
    const objectPath = `${user.id}/${slug}.${ext}`;

    const { error: upErr } = await service.storage
      .from(bucket)
      .upload(objectPath, imageBytes, {
        contentType: uploadContentType,
        upsert: false,
      });

    if (upErr) {
      return NextResponse.json(
        { error: "Storage upload failed", detail: upErr.message },
        { status: 500 },
      );
    }

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        creator_id: user.id,
        slug,
        builder: String(body.builder ?? ""),
        target: String(body.target ?? ""),
        tone: String(body.tone ?? ""),
        screen_type: String(body.screenType ?? ""),
        region: String(body.region ?? ""),
        extra_details: String(body.extraDetails ?? ""),
        generated_prompt: prompt,
        image_path: objectPath,
        visibility: "draft",
        remix_parent_id: remixParentId,
      })
      .select(
        "id, slug, builder, target, tone, screen_type, region, extra_details, image_path",
      )
      .maybeSingle();

    if (!insErr && row) {
      inserted = row;
      break;
    }

    await service.storage.from(bucket).remove([objectPath]);

    if (insErr?.code === "23505") {
      continue;
    }

    return NextResponse.json(
      { error: "Could not save generation", detail: insErr?.message },
      { status: 500 },
    );
  }

  if (!inserted) {
    return NextResponse.json(
      { error: "Could not allocate unique slug" },
      { status: 500 },
    );
  }

  // Deduct 1 credit via Dodo ledger entry (deterministic credit consumption).
  try {
    const dodoClient2 = getDodoClient();
    await dodoClient2.creditEntitlements.balances.createLedgerEntry(dodoCustomerId!, {
      credit_entitlement_id: entitlementId,
      entry_type: "debit",
      amount: "1",
      reason: "image.generated",
      idempotency_key: `gen_${inserted.id}`,
      metadata: { generation_id: String(inserted.id) },
    });
  } catch {
    const obj = inserted.image_path;
    if (obj) {
      await service.storage.from(bucket).remove([obj]);
    }
    await supabase.from("generations").delete().eq("id", inserted.id);
    return NextResponse.json(
      { error: "Credit debit failed. Please retry.", code: "billing_debit_failed" },
      { status: 502 },
    );
  }

  // Track quota/audit event after successful credit debit
  const { error: evErr } = await supabase.from("generation_events").insert({
    user_id: user.id,
    event_type: "generation",
    payload: { generation_id: inserted.id },
  });

  if (evErr) {
    console.error("generation_events insert failed", evErr);
  }

  const pathForSign = inserted.image_path;
  if (!pathForSign) {
    return NextResponse.json(
      { error: "Generation row missing image_path" },
      { status: 500 },
    );
  }

  const { data: signed, error: signErr } = await service.storage
    .from(bucket)
    .createSignedUrl(pathForSign, 3600);

  const imageUrl =
    !signErr && signed?.signedUrl ? signed.signedUrl : null;

  return NextResponse.json({
    id: inserted.id,
    slug: inserted.slug,
    imageUrl,
    imagePath: pathForSign,
    prompt: {
      builder: inserted.builder,
      target: inserted.target,
      tone: inserted.tone,
      screenType: inserted.screen_type,
      region: inserted.region,
      extraDetails: inserted.extra_details,
      generatedPrompt: prompt,
    },
    ...(signErr || !imageUrl
      ? {
          warning:
            "Image saved but signed URL could not be created; use storage with service credentials.",
        }
      : {}),
  });
}
