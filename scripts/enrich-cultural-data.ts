/**
 * Script: Enrich company profiles with cultural recognition data from Grok.
 *
 * For each company in the DB, checks if meme_exaggeration, behavioral_stereotypes,
 * and satirical_patterns are populated. If any are empty, asks Grok (via Vercel AI Gateway)
 * to generate them, then updates the DB.
 *
 * Usage: npx tsx scripts/enrich-cultural-data.ts
 * Requires: .env.local with AI_GATEWAY_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}
if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
  console.error("Missing AI_GATEWAY_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const GROK_MODEL = "xai/grok-4-fast-non-reasoning";

type StyleDna = {
  tone?: string[];
  colors?: string[];
  visual_traits?: string[];
  ux_traits?: string[];
  meme_exaggeration?: string[];
  iconic_elements?: string[];
  behavioral_stereotypes?: string[];
  satirical_patterns?: string[];
};

async function callGrok(prompt: string): Promise<string> {
  const result = await generateText({
    model: GROK_MODEL,
    system:
      "You are a cultural analyst specializing in internet humor, memes, and the stereotypical behaviors/frustrations people associate with tech companies. Respond ONLY with valid JSON arrays of strings. No markdown, no explanation.",
    prompt,
    temperature: 0.8,
    maxOutputTokens: 2000,
  });
  return result.text;
}

function parseJsonArray(raw: string): string[] {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.filter((s) => typeof s === "string");
  } catch {
    // Try to extract array from response
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed.filter((s) => typeof s === "string");
      } catch {}
    }
  }
  return [];
}

async function enrichCompany(company: { id: string; name: string; style_dna: StyleDna | null }) {
  const dna: StyleDna = company.style_dna ?? {};
  const needsMeme = !dna.meme_exaggeration || dna.meme_exaggeration.length === 0;
  const needsBehavioral = !dna.behavioral_stereotypes || dna.behavioral_stereotypes.length === 0;
  const needsSatirical = !dna.satirical_patterns || dna.satirical_patterns.length === 0;

  if (!needsMeme && !needsBehavioral && !needsSatirical) {
    console.log(`  ✓ ${company.name} — already enriched, skipping`);
    return;
  }

  console.log(`  → ${company.name} — querying Grok...`);

  const updates: Partial<StyleDna> = {};

  if (needsMeme) {
    const prompt = `For the company "${company.name}", give me 8-12 culturally recognizable meme triggers — the exact phrases, passive-aggressive notifications, guilt-trip copy, fake notices, and emotionally recognizable frustrations that people on Twitter/Reddit instantly associate with this company. These should be things that make people say "oh god they would actually do this." Return as a JSON array of strings.`;
    const raw = await callGrok(prompt);
    updates.meme_exaggeration = parseJsonArray(raw);
    console.log(`    meme_exaggeration: ${updates.meme_exaggeration.length} items`);
  }

  if (needsBehavioral) {
    const prompt = `For the company "${company.name}", give me 8-12 behavioral stereotypes — the organizational behaviors, product decisions, and UX patterns that are so stereotypically "${company.name}" they're funny. Think: how would this company handle a simple task in the most on-brand way possible? What are the running jokes about how they build products? Return as a JSON array of short descriptive strings.`;
    const raw = await callGrok(prompt);
    updates.behavioral_stereotypes = parseJsonArray(raw);
    console.log(`    behavioral_stereotypes: ${updates.behavioral_stereotypes.length} items`);
  }

  if (needsSatirical) {
    const prompt = `For the company "${company.name}", give me 8-12 satirical UX patterns — specific UI elements, flows, or interactions that would be hilariously on-brand if exaggerated. Think: what would a parody app built by this company look like? What CTAs, modals, notifications, onboarding steps, or settings would they add that are absurd but believable? Return as a JSON array of short descriptive strings.`;
    const raw = await callGrok(prompt);
    updates.satirical_patterns = parseJsonArray(raw);
    console.log(`    satirical_patterns: ${updates.satirical_patterns.length} items`);
  }

  // Merge with existing style_dna
  const mergedDna: StyleDna = { ...dna, ...updates };

  const { error } = await supabase
    .from("company_profiles")
    .update({ style_dna: mergedDna })
    .eq("id", company.id);

  if (error) {
    console.error(`    ✗ Failed to update ${company.name}:`, error.message);
  } else {
    console.log(`    ✓ Updated ${company.name}`);
  }
}

async function main() {
  console.log("Fetching company profiles from Supabase...\n");

  const { data: companies, error } = await supabase
    .from("company_profiles")
    .select("id, name, style_dna")
    .order("name");

  if (error) {
    console.error("Failed to fetch companies:", error.message);
    process.exit(1);
  }

  if (!companies || companies.length === 0) {
    console.log("No companies found in DB.");
    return;
  }

  console.log(`Found ${companies.length} companies.\n`);

  for (const company of companies) {
    await enrichCompany(company);
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n✓ Done enriching cultural data.");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
