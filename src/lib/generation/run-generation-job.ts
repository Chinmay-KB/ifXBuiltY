import {
  assertAiGatewayConfigured,
  getGenerationImagesBucket,
} from "@/lib/env-server";
import { assertDodoEntitlementConfigured } from "@/lib/dodo/client";
import { updateGenerationStatus } from "@/lib/generation/db";
import {
  debitGenerationCredit,
  executeImageGeneration,
  insertGenerationEvent,
} from "@/lib/generation/execute-image";
import { logGenerationTiming } from "@/lib/generation/timing";
import { normalizeRenderMode } from "@/lib/screen-type";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const DEFAULT_GATEWAY_IMAGE_MODEL = "openai/gpt-image-2";

export type GenerationJobInput = {
  generationId: number;
  userId: string;
  dodoCustomerId: string;
  builderId: string | null;
};

export type GenerationJobResult = {
  generationId: number;
  status: "completed" | "failed";
};

async function loadGenerationContext(generationId: number, userId: string) {
  assertAiGatewayConfigured();
  const bucket = getGenerationImagesBucket();
  const entitlementId = assertDodoEntitlementConfigured();
  const imageModel =
    process.env.AI_GATEWAY_IMAGE_MODEL?.trim() || DEFAULT_GATEWAY_IMAGE_MODEL;

  const supabase = createSupabaseServiceClient();
  const { data: row, error } = await supabase
    .from("generations")
    .select(
      "id, creator_id, slug, builder, generated_prompt, image_path, screen_type",
    )
    .eq("id", generationId)
    .eq("creator_id", userId)
    .maybeSingle();

  if (error || !row?.generated_prompt) {
    throw new Error("Generation not found");
  }

  const objectPath =
    row.image_path?.trim() ||
    `${userId}/${row.slug}.${process.env.GENERATION_DEFAULT_EXT ?? "png"}`;

  return {
    bucket,
    entitlementId,
    imageModel,
    slug: row.slug,
    builderName: row.builder,
    prompt: row.generated_prompt,
    objectPath,
    renderMode: normalizeRenderMode(row.screen_type),
  };
}

async function finalizeGeneration(args: {
  generationId: number;
  userId: string;
  dodoCustomerId: string;
  imagePath: string;
}) {
  const entitlementId = assertDodoEntitlementConfigured();

  try {
    await debitGenerationCredit({
      generationId: args.generationId,
      dodoCustomerId: args.dodoCustomerId,
      entitlementId,
    });
  } catch {
    const service = createSupabaseServiceClient();
    const bucket = getGenerationImagesBucket();
    await service.storage.from(bucket).remove([args.imagePath]);
    throw new Error("Credit debit failed");
  }

  await updateGenerationStatus(args.generationId, {
    status: "completed",
    imagePath: args.imagePath,
    imageReady: true,
    completedAt: new Date().toISOString(),
    errorMessage: null,
  });

  await insertGenerationEvent({
    userId: args.userId,
    generationId: args.generationId,
  });
}

/**
 * Runs the full image generation job (shared by inline dispatch and workflow steps).
 */
export async function runGenerationJob(
  input: GenerationJobInput,
): Promise<GenerationJobResult> {
  const jobStarted = performance.now();

  try {
    await updateGenerationStatus(input.generationId, {
      status: "processing",
      startedAt: new Date().toISOString(),
      errorMessage: null,
    });

    const ctx = await loadGenerationContext(input.generationId, input.userId);
    const image = await executeImageGeneration({
      generationId: input.generationId,
      userId: input.userId,
      dodoCustomerId: input.dodoCustomerId,
      entitlementId: ctx.entitlementId,
      bucket: ctx.bucket,
      objectPath: ctx.objectPath,
      prompt: ctx.prompt,
      imageModel: ctx.imageModel,
      builderId: input.builderId,
      builderName: ctx.builderName,
      renderMode: ctx.renderMode,
    });

    await finalizeGeneration({
      generationId: input.generationId,
      userId: input.userId,
      dodoCustomerId: input.dodoCustomerId,
      imagePath: image.imagePath,
    });

    logGenerationTiming("job_total", performance.now() - jobStarted, {
      generationId: input.generationId,
      status: "completed",
      mode: "inline",
    });

    return { generationId: input.generationId, status: "completed" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    await updateGenerationStatus(input.generationId, {
      status: "failed",
      errorMessage: msg,
      completedAt: new Date().toISOString(),
    });
    logGenerationTiming("job_total", performance.now() - jobStarted, {
      generationId: input.generationId,
      status: "failed",
      mode: "inline",
    });
    return { generationId: input.generationId, status: "failed" };
  }
}
