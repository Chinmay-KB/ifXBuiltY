import { generationImageUrl } from "@/lib/generation-media-url";
import type { GenerationStatus } from "@/lib/generation/types";
import { isGenerationStatus } from "@/lib/generation/types";

export type GenerationStatusRow = {
  id: number;
  slug: string;
  status: string;
  builder: string;
  target: string;
  error_message: string | null;
  image_path: string | null;
  image_ready?: boolean | null;
};

export function toGenerationStatusResponse(row: GenerationStatusRow) {
  const status: GenerationStatus = isGenerationStatus(row.status)
    ? row.status
    : "failed";

  const path = row.image_path?.trim();
  const hasImage =
    status === "completed" && row.image_ready === true && Boolean(path);

  return {
    id: row.id,
    slug: row.slug,
    status,
    builder: row.builder,
    target: row.target,
    errorMessage: row.error_message,
    imageUrl: hasImage && path ? generationImageUrl(path, "detail") : null,
    imageDownloadUrl: hasImage && path ? generationImageUrl(path, "full") : null,
  };
}
