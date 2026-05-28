export type GenerationMediaVariant = "card" | "detail" | "full" | "og";

const DEFAULT_GENERATION_IMAGES_BUCKET = "generation-images";

/**
 * Bucket id, consistent across server and client. `NEXT_PUBLIC_*` is inlined into
 * client bundles; the server-only name is honored as a fallback so a custom bucket
 * keeps working without a separate public var in the common (default) case.
 */
function generationImagesBucketId(): string {
  return (
    process.env.NEXT_PUBLIC_GENERATION_IMAGES_BUCKET?.trim() ||
    process.env.GENERATION_IMAGES_BUCKET?.trim() ||
    DEFAULT_GENERATION_IMAGES_BUCKET
  );
}

function supabaseBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

function encodeObjectPath(objectPath: string): string {
  return objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * Storage object key for a given display variant. Variants are produced at
 * generation time (see `executeImageGeneration`) and co-located with the original.
 */
export function generationVariantObjectPath(
  imagePath: string,
  variant: GenerationMediaVariant,
): string {
  switch (variant) {
    case "full":
      return imagePath;
    case "og":
      return `${imagePath}.og.jpg`;
    case "card":
      return `${imagePath}.card.webp`;
    case "detail":
      return `${imagePath}.detail.webp`;
  }
}

/**
 * Public, CDN-served URL for a generation image variant. The `generation-images`
 * bucket is public, so these resolve directly from Supabase's CDN with no app
 * function in the path. Returns `null` only if Supabase env is unavailable.
 */
export function generationImageUrl(
  imagePath: string,
  variant: GenerationMediaVariant,
): string | null {
  const base = supabaseBaseUrl();
  if (!base) return null;
  const objectPath = generationVariantObjectPath(imagePath, variant);
  return `${base}/storage/v1/object/public/${generationImagesBucketId()}/${encodeObjectPath(objectPath)}`;
}
