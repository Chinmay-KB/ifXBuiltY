import { generateText } from "ai";

import { getAiGatewayTextModel } from "@/lib/ai-gateway";
import {
  createResearchRun,
  updateResearchRunStatus,
} from "@/lib/research/db";
import {
  discoveredProductCandidateSchema,
  productResearchAgentInputSchema,
  researchedProductProfileSchema,
} from "@/lib/research/schemas";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import {
  findOfficialSources,
  fetchPageContent,
  summarizeMemeDna,
  summarizeProductProfile,
} from "../research-product/steps";

export type DiscoverProductsInput = {
  seedCompanyName?: string;
  seedCategory?: string;
  maxProducts?: number;
};

export async function discoverCompanyProducts(
  raw: DiscoverProductsInput,
): Promise<{ runId: string; draftCount: number }> {
  "use workflow";

  const input = productResearchAgentInputSchema.parse({
    seedCompanyName: raw.seedCompanyName,
    seedCategory: raw.seedCategory,
    maxProducts: raw.maxProducts ?? 5,
    runMode: "discover",
  });

  const run = await createResearchRun(input);
  const runId = run.id as string;

  try {
    await updateResearchRunStatus(runId, "discovering");

    const candidates = await discoverCandidates(input);
    await updateResearchRunStatus(runId, "researching");

    let draftCount = 0;
    for (const candidate of candidates.slice(0, input.maxProducts)) {
      const saved = await researchOneCandidate(runId, candidate.productSlug, candidate.name);
      if (saved) draftCount++;
    }

    await updateResearchRunStatus(runId, draftCount > 0 ? "needs_review" : "failed", draftCount > 0 ? undefined : "No drafts produced");
    return { runId, draftCount };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Workflow failed";
    await updateResearchRunStatus(runId, "failed", msg);
    throw e;
  }
}

async function discoverCandidates(input: {
  seedCompanyName?: string;
  seedCategory?: string;
  maxProducts: number;
}) {
  "use step";

  const seed = input.seedCompanyName ?? input.seedCategory ?? "technology";
  const { text } = await generateText({
    model: getAiGatewayTextModel(),
    prompt: `List up to ${input.maxProducts + 3} well-known products from "${seed}". Return JSON only: {"products":[{"name":"...","slug":"kebab-case-id","category":"...","screenType":"desktop web|mobile app|desktop app|OS shell","parentCompanyId":"kebab-case-company","officialUrl":"https://..."}]}`,
    temperature: 0.2,
    maxOutputTokens: 2000,
  });

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];

  const parsed = JSON.parse(match[0]) as {
    products?: Array<Record<string, unknown>>;
  };

  const out = [];
  for (const p of parsed.products ?? []) {
    const slug = String(p.slug ?? "").trim();
    const name = String(p.name ?? "").trim();
    if (!slug || !name) continue;
    const c = discoveredProductCandidateSchema.safeParse({
      productSlug: slug,
      name,
      parentCompanyId: p.parentCompanyId ? String(p.parentCompanyId) : null,
      category: String(p.category ?? ""),
      screenTypeGuess: String(p.screenType ?? "desktop web"),
      officialUrl: p.officialUrl ? String(p.officialUrl) : undefined,
      citations: p.officialUrl ? [String(p.officialUrl)] : [],
    });
    if (c.success) out.push(c.data);
  }
  return out;
}

async function researchOneCandidate(runId: string, productSlug: string, name: string) {
  "use step";

  const sources = await findOfficialSources(productSlug);
  const fetched = await Promise.all(
    sources.officialUrls.slice(0, 2).map((url) => fetchPageContent(url)),
  );
  const valid = fetched.filter((s) => s.content !== null);
  if (valid.length === 0) return false;

  const profileDraft = await summarizeProductProfile(productSlug, valid);
  const memeDraft = await summarizeMemeDna(productSlug);

  const profile = researchedProductProfileSchema.safeParse({
    productSlug,
    name: String(profileDraft.name ?? name),
    parentCompanyId: profileDraft.parent_company_id ?? null,
    category: profileDraft.category ?? "",
    screenType: profileDraft.screen_type ?? "desktop web",
    popularityTier: 2,
    memeStrength: 3,
    styleDna: profileDraft.style_dna ?? {},
    archetype: profileDraft.archetype ?? {},
    defaultVibeTags: profileDraft.default_vibe_tags ?? [],
    sourceUrls: valid.map((s) => s.url),
  });

  if (!profile.success) return false;

  const supabase = createSupabaseServiceClient();
  const { data: draft, error } = await supabase
    .from("product_profile_drafts")
    .upsert(
      {
        run_id: runId,
        product_slug: productSlug,
        name: profile.data.name,
        parent_company_id: profile.data.parentCompanyId,
        category: profile.data.category,
        screen_type: profile.data.screenType,
        popularity_tier: profile.data.popularityTier,
        meme_strength: profile.data.memeStrength,
        style_dna: profile.data.styleDna,
        archetype: profile.data.archetype,
        default_vibe_tags: profile.data.defaultVibeTags,
        research_status: "needs_review",
      },
      { onConflict: "run_id,product_slug" },
    )
    .select("id")
    .single();

  if (error || !draft) return false;

  if (memeDraft && typeof memeDraft === "object") {
    const style = profile.data.styleDna;
    const meme = memeDraft as Record<string, unknown>;
    if (Array.isArray(meme.observed_memes)) {
      style.meme_exaggeration = [
        ...style.meme_exaggeration,
        ...meme.observed_memes.map(String),
      ];
    }
    await supabase
      .from("product_profile_drafts")
      .update({ style_dna: style })
      .eq("id", draft.id);
  }

  return true;
}
