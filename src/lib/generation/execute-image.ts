import { Buffer } from "node:buffer";

import { generateImage, generateText } from "ai";
import sharp from "sharp";

import {
  getCompanyScreenshots,
} from "@/data/company-profiles";
import { generationVariantObjectPath } from "@/lib/generation-media-url";
import {
  contentTypeForDisplayVariant,
  renderDisplayVariant,
} from "@/lib/generation/render-display-variants";
import { getDodoClient } from "@/lib/dodo/client";
import {
  getGenerationImageSize,
  normalizeRenderMode,
  type RenderMode,
} from "@/lib/screen-type";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { withGenerationTiming } from "@/lib/generation/timing";

function resolveImageSize(args: {
  imageModel: string;
  renderMode: RenderMode;
}): `${number}x${number}` {
  // Default: follow existing screen_type → aspect ratio mapping.
  const base = getGenerationImageSize(normalizeRenderMode(args.renderMode));

  // Some providers enforce a minimum pixel count. Seedream currently requires
  // >= 3,686,400 pixels; 2048x2048 = 4,194,304.
  if (args.imageModel.trim().toLowerCase().startsWith("bytedance/seedream")) {
    return "2048x2048";
  }

  return base;
}

export type ExecuteImageGenerationArgs = {
  generationId: number;
  userId: string;
  dodoCustomerId: string;
  entitlementId: string;
  bucket: string;
  objectPath: string;
  prompt: string;
  imageModel: string;
  builderId: string | null;
  builderName: string;
  renderMode: RenderMode;
};

export type ExecuteImageGenerationResult = {
  imagePath: string;
  mediaType: string;
};

function extFromMediaType(mediaType: string): string {
  if (mediaType === "image/png") return "png";
  if (mediaType === "image/jpeg" || mediaType === "image/jpg") return "jpg";
  if (mediaType === "image/webp") return "webp";
  return "png";
}

function imageQualitySetting(): "low" | "medium" | "high" {
  const raw = process.env.GENERATION_IMAGE_QUALITY?.trim().toLowerCase();
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return "high";
}

function isGeminiNanoBananaImageModel(model: string): boolean {
  return model.trim().toLowerCase().startsWith("google/gemini-3.1-flash-image-preview");
}

function isLanguageModelNotImageModelError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return msg.includes("is a language model, not an image model");
}

async function generateImageViaTextModel(args: {
  imageModel: string;
  prompt: string | { images: Buffer[]; text: string };
  userId: string;
}): Promise<{ bytes: Buffer; mediaType: string }> {
  // Nano Banana models return images as files on generateText().
  const promptAsText =
    typeof args.prompt === "string" ? args.prompt : args.prompt.text;

  const result = await generateText({
    model: args.imageModel,
    prompt: promptAsText,
    providerOptions: {
      google: {
        // Force image output. Some models may also return text; we ignore it.
        responseModalities: ["IMAGE"],
      },
      gateway: {
        user: args.userId,
        tags: ["feature:generate", "app:ifxbuilty"],
      },
    },
  });

  const imageFile = (result.files ?? []).find((f) =>
    (f.mediaType ?? "").startsWith("image/"),
  );
  if (!imageFile?.uint8Array || imageFile.uint8Array.length === 0) {
    throw new Error("No image data returned");
  }

  return {
    bytes: Buffer.from(imageFile.uint8Array),
    mediaType: imageFile.mediaType ?? "image/png",
  };
}

/**
 * Build and upload the CDN display variants (card/detail/og) alongside the
 * original. Generating these at generation time means every completed generation
 * is immediately servable from the public bucket with no runtime transform.
 */
async function uploadDisplayVariants(args: {
  service: ReturnType<typeof createSupabaseServiceClient>;
  bucket: string;
  objectPath: string;
  imageBytes: Buffer;
}): Promise<void> {
  const base = sharp(args.imageBytes).rotate();
  const meta = await base.metadata();
  const imageSize = { width: meta.width ?? 1, height: meta.height ?? 1 };

  const [card, detail, og] = await Promise.all(
    (["card", "detail", "og"] as const).map(async (variant) => ({
      bytes: await renderDisplayVariant(base, variant, imageSize),
      variant,
      contentType: contentTypeForDisplayVariant(variant),
    })),
  );
  const variants = [card, detail, og];

  const results = await Promise.all(
    variants.map(({ bytes, variant, contentType }) =>
      args.service.storage
        .from(args.bucket)
        .upload(generationVariantObjectPath(args.objectPath, variant), bytes, {
          contentType,
          upsert: true,
        }),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new Error(`Variant upload failed: ${failed.error.message}`);
  }
}

async function downloadScreenshot(
  service: ReturnType<typeof createSupabaseServiceClient>,
  path: string,
): Promise<Buffer | null> {
  const { data: fileData } = await service.storage
    .from("company-screenshots")
    .download(path);
  if (!fileData) return null;
  const arrayBuf = await fileData.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function loadScreenshotBuffers(
  builderId: string | null,
  builderName: string,
): Promise<Buffer[]> {
  const screenshotBuffers: Buffer[] = [];
  try {
    const service = createSupabaseServiceClient();
    let resolvedBuilderId = builderId;
    if (!resolvedBuilderId && builderName) {
      const { data: companyRow } = await service
        .from("company_profiles")
        .select("id")
        .ilike("name", builderName)
        .maybeSingle();
      resolvedBuilderId = companyRow?.id ?? null;
    }

    if (resolvedBuilderId) {
      const screenshotPaths = await getCompanyScreenshots(resolvedBuilderId);
      const downloads = await Promise.all(
        screenshotPaths.map((path) => downloadScreenshot(service, path)),
      );
      for (const buf of downloads) {
        if (buf) screenshotBuffers.push(buf);
      }
    }
  } catch {
    // Non-fatal
  }
  return screenshotBuffers;
}

export async function executeImageGeneration(
  args: ExecuteImageGenerationArgs,
): Promise<ExecuteImageGenerationResult> {
  const renderMode = normalizeRenderMode(args.renderMode);
  const size = resolveImageSize({ imageModel: args.imageModel, renderMode });
  const quality = imageQualitySetting();

  const screenshotBuffers = await withGenerationTiming(
    "screenshots_load",
    () => loadScreenshotBuffers(args.builderId, args.builderName),
    { generationId: args.generationId },
  );

  const promptInput: string | { images: Buffer[]; text: string } =
    screenshotBuffers.length > 0
      ? { images: screenshotBuffers, text: args.prompt }
      : args.prompt;

  let uploadContentType: string;
  let imageBytes: Buffer;

  try {
    const result = await withGenerationTiming(
      "ai_generate_image",
      () =>
        generateImage({
          model: args.imageModel,
          prompt: promptInput,
          size,
          providerOptions: {
            openai: {
              quality,
            },
            gateway: {
              user: args.userId,
              tags: ["feature:generate", "app:ifxbuilty"],
            },
          },
        }),
      { generationId: args.generationId, size, quality, renderMode },
    );

    const file = result.image;
    uploadContentType = file.mediaType;
    imageBytes = Buffer.from(file.uint8Array);
  } catch (e) {
    // Gemini Nano Banana image models are exposed as multimodal LMs on the gateway.
    // They can still output images, but via generateText() returning result.files.
    if (isGeminiNanoBananaImageModel(args.imageModel) && isLanguageModelNotImageModelError(e)) {
      const viaText = await withGenerationTiming(
        "ai_generate_image",
        () =>
          generateImageViaTextModel({
            imageModel: args.imageModel,
            prompt: promptInput,
            userId: args.userId,
          }),
        { generationId: args.generationId, size, quality, renderMode, fallback: "generateText" },
      );
      uploadContentType = viaText.mediaType;
      imageBytes = viaText.bytes;
    } else {
      throw e;
    }
  }

  if (imageBytes.length === 0) {
    throw new Error("No image data returned");
  }

  const service = createSupabaseServiceClient();
  await withGenerationTiming(
    "storage_upload",
    async () => {
      const { error: upErr } = await service.storage
        .from(args.bucket)
        .upload(args.objectPath, imageBytes, {
          contentType: uploadContentType,
          upsert: true,
        });

      if (upErr) {
        throw new Error(`Storage upload failed: ${upErr.message}`);
      }
    },
    { generationId: args.generationId, bytes: imageBytes.length },
  );

  await withGenerationTiming(
    "variants_generate",
    () =>
      uploadDisplayVariants({
        service,
        bucket: args.bucket,
        objectPath: args.objectPath,
        imageBytes,
      }),
    { generationId: args.generationId },
  );

  return {
    imagePath: args.objectPath,
    mediaType: uploadContentType || `image/${extFromMediaType("image/png")}`,
  };
}

export async function debitGenerationCredit(args: {
  generationId: number;
  dodoCustomerId: string;
  entitlementId: string;
}): Promise<void> {
  const dodoClient = getDodoClient();
  await withGenerationTiming(
    "dodo_debit",
    () =>
      dodoClient.creditEntitlements.balances.createLedgerEntry(
        args.dodoCustomerId,
        {
          credit_entitlement_id: args.entitlementId,
          entry_type: "debit",
          amount: "1",
          reason: "image.generated",
          idempotency_key: `gen_${args.generationId}`,
          metadata: { generation_id: String(args.generationId) },
        },
      ),
    { generationId: args.generationId },
  );
}

export async function insertGenerationEvent(args: {
  userId: string;
  generationId: number;
}): Promise<void> {
  const service = createSupabaseServiceClient();
  const { error } = await service.from("generation_events").insert({
    user_id: args.userId,
    event_type: "generation",
    payload: { generation_id: args.generationId },
  });
  if (error) {
    console.error("generation_events insert failed", error);
  }
}
