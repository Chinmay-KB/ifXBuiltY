import { Buffer } from "node:buffer";

import sharp from "sharp";

import { getGenerationImagesBucket } from "@/lib/env-server";
import { generationVariantObjectPath } from "@/lib/generation-media-url";
import type { createSupabaseServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createSupabaseServiceClient>;

const DISPLAY_VARIANTS = ["card", "detail", "og"] as const;
type DisplayVariant = (typeof DISPLAY_VARIANTS)[number];

function basename(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx >= 0 ? path.slice(idx + 1) : path;
}

function dirname(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx <= 0 ? "" : path.slice(0, idx);
}

function renderVariant(base: sharp.Sharp, variant: DisplayVariant): Promise<Buffer> {
  switch (variant) {
    case "card":
      return base.clone().resize({ width: 560, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    case "detail":
      return base.clone().resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    case "og":
      return base.clone().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
  }
}

function contentTypeFor(variant: DisplayVariant): string {
  return variant === "og" ? "image/jpeg" : "image/webp";
}

/**
 * Ensure the public display variants (card/detail/og) exist for an original image
 * object. Only the missing ones are generated. All storage I/O uses the service
 * client, so it works regardless of RLS. Returns the number of variants written.
 */
export async function ensureGenerationVariants(opts: {
  service: ServiceClient;
  originalPath: string;
}): Promise<number> {
  const { service, originalPath } = opts;
  const bucket = getGenerationImagesBucket();

  const wanted = DISPLAY_VARIANTS.map((variant) => ({
    variant,
    path: generationVariantObjectPath(originalPath, variant),
  }));

  const { data: objects } = await service.storage
    .from(bucket)
    .list(dirname(originalPath), { search: basename(originalPath) });
  const existing = new Set((objects ?? []).map((o) => o.name));
  const missing = wanted.filter((w) => !existing.has(basename(w.path)));

  if (missing.length === 0) return 0;

  const { data: blob, error: dlErr } = await service.storage
    .from(bucket)
    .download(originalPath);
  if (dlErr || !blob) {
    throw new Error("Could not download original image");
  }

  const base = sharp(Buffer.from(await blob.arrayBuffer())).rotate();

  const results = await Promise.all(
    missing.map(async ({ variant, path }) => {
      const bytes = await renderVariant(base, variant);
      return service.storage.from(bucket).upload(path, bytes, {
        upsert: true,
        contentType: contentTypeFor(variant),
      });
    }),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new Error(`Variant upload failed: ${failed.error.message}`);
  }

  return missing.length;
}
