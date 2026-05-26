#!/usr/bin/env node
/**
 * Set image_ready from storage existence (fixes legacy completed rows with missing files).
 * Usage: node --env-file=.env.local scripts/sync-image-ready.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.GENERATION_IMAGES_BUCKET?.trim() || "generation-images";

if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: rows, error } = await supabase
  .from("generations")
  .select("id, slug, image_path, image_ready, status")
  .eq("status", "completed")
  .not("image_path", "is", null);

if (error) {
  console.error(error.message);
  process.exit(1);
}

let setReady = 0;
let setNotReady = 0;

for (const row of rows ?? []) {
  const path = row.image_path?.trim();
  if (!path) continue;

  const { data: file, error: dlErr } = await supabase.storage
    .from(bucket)
    .download(path);

  const exists = !dlErr && file;
  const shouldBeReady = Boolean(exists);

  if (row.image_ready === shouldBeReady) continue;

  const { error: upErr } = await supabase
    .from("generations")
    .update({ image_ready: shouldBeReady })
    .eq("id", row.id);

  if (upErr) {
    console.error(`id=${row.id} slug=${row.slug}`, upErr.message);
    continue;
  }

  if (shouldBeReady) {
    setReady += 1;
    console.log(`ready: ${row.slug}`);
  } else {
    setNotReady += 1;
    console.log(`hidden from feed: ${row.slug}`);
  }
}

console.log(`Done. marked ready=${setReady}, not ready=${setNotReady}`);
