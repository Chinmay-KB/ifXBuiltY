/**
 * One-off backfill: generate publish-time image variants for all published generations.
 *
 * This produces and uploads:
 * - `${image_path}.card.webp`   (560w)
 * - `${image_path}.detail.webp` (1280w)
 * - `${image_path}.og.jpg`      (1200w)
 *
 * Usage:
 *   yarn tsx scripts/backfill-generation-variants.ts
 *
 * Requires:
 * - `.env.local` with NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)
 *
 * Optional env:
 * - VARIANTS_DRY_RUN=1        (do not upload, only log)
 * - VARIANTS_CONCURRENCY=2    (default: 2)
 * - VARIANTS_BATCH=200        (default: 200)
 * - VARIANTS_START_OFFSET=0   (default: 0)
 * - VARIANTS_LIMIT=0          (0 = no limit)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import sharp from "sharp";

import { getGenerationImagesBucket } from "@/lib/env-server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type GenerationRow = {
  id: number;
  slug: string;
  image_path: string | null;
};

function variantObjectPath(
  originalPath: string,
  variant: "card" | "detail" | "og",
): { path: string; contentType: string } {
  if (variant === "og") return { path: `${originalPath}.og.jpg`, contentType: "image/jpeg" };
  return { path: `${originalPath}.${variant}.webp`, contentType: "image/webp" };
}

function dirname(p: string): string {
  const idx = p.lastIndexOf("/");
  if (idx <= 0) return "";
  return p.slice(0, idx);
}

function basename(p: string): string {
  const idx = p.lastIndexOf("/");
  return idx >= 0 ? p.slice(idx + 1) : p;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]!, i);
    }
  }

  const workers = Array.from({ length: Math.max(1, limit) }, () => worker());
  await Promise.all(workers);
  return out;
}

async function ensureVariantsForPath(opts: {
  supabase: ReturnType<typeof createSupabaseServiceClient>;
  originalPath: string;
  dryRun: boolean;
}) {
  const { supabase, originalPath, dryRun } = opts;
  const bucket = getGenerationImagesBucket();

  // Check existence using a directory list (cheap) rather than downloading variants.
  const folder = dirname(originalPath);
  const base = basename(originalPath);
  const want = [
    variantObjectPath(originalPath, "card"),
    variantObjectPath(originalPath, "detail"),
    variantObjectPath(originalPath, "og"),
  ];

  const { data: objects, error: listErr } = await supabase.storage
    .from(bucket)
    .list(folder, { search: base });
  if (listErr) throw new Error(`list failed: ${listErr.message}`);

  const existing = new Set((objects ?? []).map((o) => o.name));
  const missing = want.filter((v) => !existing.has(basename(v.path)));

  if (missing.length === 0) return { didWork: false, missing: 0 };

  const { data: blob, error: dlErr } = await supabase.storage
    .from(bucket)
    .download(originalPath);
  if (dlErr || !blob) throw new Error("download failed");

  const input = Buffer.from(await blob.arrayBuffer());
  const basePipeline = sharp(input).rotate();

  const card = await basePipeline
    .clone()
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const detail = await basePipeline
    .clone()
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const og = await basePipeline
    .clone()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const byVariant = {
    card,
    detail,
    og,
  } as const;

  if (dryRun) {
    return { didWork: true, missing: missing.length };
  }

  for (const v of missing) {
    const key = v.path.endsWith(".og.jpg") ? "og" : v.path.endsWith(".detail.webp") ? "detail" : "card";
    const payload = byVariant[key];
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(v.path, payload, {
        upsert: true,
        contentType: v.contentType,
      });
    if (upErr) throw new Error(`upload failed: ${upErr.message}`);
  }

  return { didWork: true, missing: missing.length };
}

async function main() {
  const supabase = createSupabaseServiceClient();

  const dryRun = process.env.VARIANTS_DRY_RUN === "1";
  const batchSize = Number(process.env.VARIANTS_BATCH ?? "200");
  const startOffset = Number(process.env.VARIANTS_START_OFFSET ?? "0");
  const limitTotal = Number(process.env.VARIANTS_LIMIT ?? "0");
  const concurrency = Number(process.env.VARIANTS_CONCURRENCY ?? "2");

  console.log(`Backfill generation variants`);
  console.log(`- dryRun: ${dryRun}`);
  console.log(`- concurrency: ${concurrency}`);
  console.log(`- batchSize: ${batchSize}`);
  console.log(`- startOffset: ${startOffset}`);
  console.log(`- limitTotal: ${limitTotal || "∞"}`);

  let offset = startOffset;
  let processed = 0;
  let touched = 0;
  let failures = 0;
  let generatedMissing = 0;

  while (true) {
    const { data: rows, error } = await supabase
      .from("generations")
      .select("id, slug, image_path")
      .eq("visibility", "published")
      .eq("status", "completed")
      .eq("image_ready", true)
      .not("image_path", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) break;

    const items = rows as GenerationRow[];
    const capped =
      limitTotal > 0 ? items.slice(0, Math.max(0, limitTotal - processed)) : items;
    if (capped.length === 0) break;

    console.log(`\nBatch offset ${offset} (${capped.length} rows)`);

    await mapLimit(capped, concurrency, async (row) => {
      processed++;
      const imagePath = row.image_path?.trim();
      if (!imagePath) return;

      try {
        const res = await ensureVariantsForPath({
          supabase,
          originalPath: imagePath,
          dryRun,
        });
        if (res.didWork) touched++;
        generatedMissing += res.missing;
      } catch (e) {
        failures++;
        console.error(`  ✗ gen ${row.id} (${row.slug}) failed:`, (e as Error).message);
      }
    });

    if (rows.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`\n--- Done ---`);
  console.log(`Processed generations: ${processed}`);
  console.log(`Touched (had missing variants): ${touched}`);
  console.log(`Total missing variants generated/uploaded: ${generatedMissing}`);
  console.log(`Failures: ${failures}`);

  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});

