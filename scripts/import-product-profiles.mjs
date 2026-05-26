#!/usr/bin/env node
/**
 * Import researched product profiles into Supabase company_profiles.
 *
 * Usage:
 *   node scripts/import-product-profiles.mjs              # dry-run by default
 *   node scripts/import-product-profiles.mjs --apply      # actually upsert
 *   node scripts/import-product-profiles.mjs --file path  # import a single file
 *
 * Reads from src/data/product-profiles/*.json
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const profilesDir = join(projectRoot, "src", "data", "product-profiles");

const args = process.argv.slice(2);
const isApply = args.includes("--apply");
const singleFile = args.find((a) => a.startsWith("--file="))?.split("=")[1];

// ---------------------------------------------------------------------------
// Supabase client (lazy — only needed in --apply mode)
// ---------------------------------------------------------------------------

let supabase = null;

async function getSupabase() {
  if (supabase) return supabase;
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }
  supabase = createClient(url, key);
  return supabase;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = ["id", "name", "parent_company_id", "style_dna", "archetype"];
const VALID_STATUSES = ["seed", "researched", "reviewed", "approved", "rejected"];
const VALID_SCREEN_TYPES = ["desktop web", "mobile app", "desktop app", "console", "OS shell"];

function validateProfile(profile, filePath) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!profile[field]) {
      errors.push(`Missing required field: "${field}"`);
    }
  }
  if (profile.research_status && !VALID_STATUSES.includes(profile.research_status)) {
    errors.push(`Invalid research_status: "${profile.research_status}" (must be one of ${VALID_STATUSES.join(", ")})`);
  }
  if (profile.screen_type && !VALID_SCREEN_TYPES.includes(profile.screen_type)) {
    errors.push(`Invalid screen_type: "${profile.screen_type}" (must be one of ${VALID_SCREEN_TYPES.join(", ")})`);
  }
  if (profile.popularity_tier && ![1, 2, 3].includes(profile.popularity_tier)) {
    errors.push(`Invalid popularity_tier: "${profile.popularity_tier}" (must be 1, 2, or 3)`);
  }
  if (profile.meme_strength && (profile.meme_strength < 1 || profile.meme_strength > 5)) {
    errors.push(`Invalid meme_strength: "${profile.meme_strength}" (must be 1-5)`);
  }
  if (errors.length > 0) {
    return { valid: false, errors: errors.map((e) => `  ${filePath}: ${e}`) };
  }
  return { valid: true, errors: [] };
}

// ---------------------------------------------------------------------------
// File loading
// ---------------------------------------------------------------------------

function loadProfiles() {
  if (singleFile) {
    const path = resolve(projectRoot, singleFile);
    const raw = readFileSync(path, "utf-8");
    return [{ profile: JSON.parse(raw), filePath: singleFile }];
  }

  const files = readdirSync(profilesDir).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  const results = [];
  for (const file of files) {
    const path = join(profilesDir, file);
    const raw = readFileSync(path, "utf-8");
    results.push({ profile: JSON.parse(raw), filePath: `src/data/product-profiles/${file}` });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

function profileToRow(profile) {
  const archetype = { ...(profile.archetype ?? {}) };
  if (profile.screen_type && !archetype.layout) {
    archetype.layout = profile.screen_type;
  }

  const styleDna = profile.style_dna ?? {};
  const hasRichProfile =
    Array.isArray(styleDna.meme_exaggeration) && styleDna.meme_exaggeration.length > 0;

  let researchStatus = profile.research_status ?? "seed";
  if (hasRichProfile && researchStatus === "seed") {
    researchStatus = "approved";
  }

  return {
    id: profile.id,
    name: profile.name,
    parent_company_id: profile.parent_company_id ?? null,
    profile_type: "product",
    category: profile.category ?? "",
    popularity_tier: profile.popularity_tier ?? 2,
    research_status: researchStatus,
    source_urls: Array.isArray(profile.reference_urls) ? profile.reference_urls : [],
    meme_strength: profile.meme_strength ?? 3,
    style_dna: styleDna,
    archetype,
    default_vibe_tags: Array.isArray(profile.default_vibe_tags) ? profile.default_vibe_tags : [],
    logo_path: null,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nProduct Profile Import${isApply ? " (APPLY MODE)" : " (DRY RUN)"}\n`);

  const loaded = loadProfiles();
  if (loaded.length === 0) {
    console.log("No product profiles found to import.");
    console.log(`Place JSON files in: ${profilesDir}`);
    return;
  }

  // Validate
  const allErrors = [];
  const validProfiles = [];
  for (const { profile, filePath } of loaded) {
    const result = validateProfile(profile, filePath);
    if (result.valid) {
      validProfiles.push({ profile, filePath });
    } else {
      allErrors.push(...result.errors);
    }
  }

  if (allErrors.length > 0) {
    console.log(`Validation errors (${allErrors.length}):`);
    for (const err of allErrors) {
      console.log(err);
    }
    console.log(`\n${validProfiles.length} valid, ${allErrors.length} invalid. Fix errors before importing.`);
    process.exit(1);
  }

  console.log(`Found ${validProfiles.length} valid product profile(s)\n`);

  // Dry run summary
  if (!isApply) {
    console.log("Dry run — would upsert the following:");
    for (const { profile } of validProfiles) {
      const row = profileToRow(profile);
      console.log(`  • ${row.id} (${row.name}) — parent: ${row.parent_company_id}, status: ${row.research_status}`);
    }
    console.log(`\nRun with --apply to actually import.`);
    return;
  }

  // Apply
  const client = await getSupabase();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const { profile } of validProfiles) {
    const row = profileToRow(profile);
    const { data, error } = await client
      .from("company_profiles")
      .upsert(row, { onConflict: "id" })
      .select("id")
      .single();

    if (error) {
      console.log(`  ✗ ${row.id}: ${error.message}`);
      skipped++;
    } else if (data) {
      // Check if it was an insert or update by querying created_at
      const { data: existing } = await client
        .from("company_profiles")
        .select("created_at, updated_at")
        .eq("id", row.id)
        .single();

      if (existing && existing.created_at === existing.updated_at) {
        created++;
      } else {
        updated++;
      }
      console.log(`  ✓ ${row.id}`);
    }
  }

  console.log(`\nImport complete: ${created} created, ${updated} updated, ${skipped} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
