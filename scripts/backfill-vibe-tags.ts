/**
 * Backfill script: Populate vibe_tags on existing generations.
 *
 * For each generation with an empty vibe_tags array, looks up the builder's
 * default_vibe_tags from company_profiles and applies them.
 *
 * Usage: yarn tsx scripts/backfill-vibe-tags.ts
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createSupabaseServiceClient } from "@/lib/supabase/service";

const BATCH_SIZE = 200;

async function main() {
  const supabase = createSupabaseServiceClient();

  // Step 1: Build a map of company name → default_vibe_tags (case-insensitive key)
  console.log("Fetching company profiles...");
  const { data: companies, error: companyError } = await supabase
    .from("company_profiles")
    .select("name, default_vibe_tags");

  if (companyError) {
    console.error("Failed to fetch company profiles:", companyError.message);
    process.exit(1);
  }

  const vibeMap = new Map<string, string[]>();
  for (const company of companies ?? []) {
    if (company.default_vibe_tags && company.default_vibe_tags.length > 0) {
      vibeMap.set(company.name.toLowerCase(), company.default_vibe_tags);
    }
  }

  console.log(`Loaded ${vibeMap.size} companies with default vibe tags.\n`);

  // Step 2: Process generations with empty vibe_tags in batches
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let offset = 0;

  while (true) {
    const { data: rows, error: fetchError } = await supabase
      .from("generations")
      .select("id, builder")
      .eq("vibe_tags", "{}")
      .range(offset, offset + BATCH_SIZE - 1);

    if (fetchError) {
      console.error("Failed to fetch generations:", fetchError.message);
      process.exit(1);
    }

    if (!rows || rows.length === 0) {
      break;
    }

    for (const row of rows) {
      totalProcessed++;
      const key = row.builder?.toLowerCase();
      const tags = key ? vibeMap.get(key) : undefined;

      if (tags) {
        const { error: updateError } = await supabase
          .from("generations")
          .update({ vibe_tags: tags })
          .eq("id", row.id);

        if (updateError) {
          console.error(`  ✗ Failed to update generation ${row.id}:`, updateError.message);
          totalSkipped++;
        } else {
          totalUpdated++;
        }
      } else {
        totalSkipped++;
      }
    }

    console.log(`  Batch processed: ${rows.length} rows (offset ${offset})`);

    // If we got fewer rows than BATCH_SIZE, we've reached the end
    if (rows.length < BATCH_SIZE) {
      break;
    }

    offset += BATCH_SIZE;
  }

  console.log("\n--- Backfill complete ---");
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Updated:         ${totalUpdated}`);
  console.log(`Skipped:         ${totalSkipped}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
