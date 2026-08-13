import { revalidateSelectableCompanyGroups } from "@/data/revalidate-selectable-company-groups";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

import type { ProductResearchAgentInput } from "./schemas";

export async function createResearchRun(input: ProductResearchAgentInput) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("product_research_runs")
    .insert({
      seed_company_name: input.seedCompanyName ?? null,
      seed_category: input.seedCategory ?? null,
      max_products: input.maxProducts,
      status: "queued",
    })
    .select("id, status, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function updateResearchRunStatus(
  runId: string,
  status: string,
  errorMessage?: string,
) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("product_research_runs")
    .update({ status, error_message: errorMessage ?? null })
    .eq("id", runId);
  if (error) throw error;
}

export async function listResearchRuns(limit = 50) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("product_research_runs")
    .select("id, seed_company_name, seed_category, max_products, status, error_message, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listDraftsForRun(runId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("product_profile_drafts")
    .select("*")
    .eq("run_id", runId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listDraftsNeedingReview(limit = 100) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("product_profile_drafts")
    .select("*")
    .eq("research_status", "needs_review")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function publishDraftToProfile(draftId: string) {
  const supabase = createSupabaseServiceClient();
  const { data: draft, error: dErr } = await supabase
    .from("product_profile_drafts")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();
  if (dErr || !draft) throw new Error("Draft not found");

  const row = {
    id: draft.product_slug as string,
    name: draft.name as string,
    parent_company_id: (draft.parent_company_id as string) ?? null,
    profile_type: "product",
    category: (draft.category as string) ?? "",
    popularity_tier: (draft.popularity_tier as number) ?? 2,
    research_status: "approved",
    source_urls: [],
    meme_strength: (draft.meme_strength as number) ?? 3,
    style_dna: draft.style_dna,
    archetype: draft.archetype,
    default_vibe_tags: draft.default_vibe_tags,
    logo_path: null,
  };

  const { error: upErr } = await supabase
    .from("company_profiles")
    .upsert(row, { onConflict: "id" });
  if (upErr) throw upErr;

  const { error: stErr } = await supabase
    .from("product_profile_drafts")
    .update({
      research_status: "published",
      published_profile_id: draft.product_slug,
    })
    .eq("id", draftId);
  if (stErr) throw stErr;

  revalidateSelectableCompanyGroups();

  return { profileId: draft.product_slug as string };
}
