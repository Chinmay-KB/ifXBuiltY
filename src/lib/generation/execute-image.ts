import { Buffer } from "node:buffer";

import { generateImage } from "ai";

import {
  getCompanyProfileById,
  getCompanyScreenshots,
} from "@/data/company-profiles";
import { getDodoClient } from "@/lib/dodo/client";
import {
  getGenerationImageSize,
  normalizeRenderMode,
  type RenderMode,
} from "@/lib/screen-type";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { withGenerationTiming } from "@/lib/generation/timing";

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
  const size = getGenerationImageSize(renderMode);
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
  const uploadContentType = file.mediaType;
  const imageBytes = Buffer.from(file.uint8Array);

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
