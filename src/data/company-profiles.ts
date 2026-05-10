import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type StyleDna = {
  tone: string[];
  colors: string[];
  visual_traits: string[];
  ux_traits: string[];
  meme_exaggeration: string[];
  iconic_elements: string[];
  behavioral_stereotypes: string[];
  satirical_patterns: string[];
};

export type Archetype = {
  type: string;
  sections: string[];
  layout: string;
  content_style: string[];
};

export type CompanyProfile = {
  id: string;
  name: string;
  styleDna: StyleDna;
  archetype: Archetype;
  /** Path in company-logos bucket, or null if no logo uploaded */
  logoPath: string | null;
};

const EMPTY_STYLE_DNA: StyleDna = {
  tone: [],
  colors: [],
  visual_traits: [],
  ux_traits: [],
  meme_exaggeration: [],
  iconic_elements: [],
  behavioral_stereotypes: [],
  satirical_patterns: [],
};

const EMPTY_ARCHETYPE: Archetype = {
  type: "",
  sections: [],
  layout: "",
  content_style: [],
};

/**
 * Convert a DB row to a CompanyProfile.
 */
function mapRow(row: Record<string, unknown>): CompanyProfile {
  const rawDna = row.style_dna as Record<string, unknown> | null;
  const rawArch = row.archetype as Record<string, unknown> | null;

  return {
    id: row.id as string,
    name: row.name as string,
    styleDna: rawDna
      ? {
          tone: Array.isArray(rawDna.tone) ? rawDna.tone : [],
          colors: Array.isArray(rawDna.colors) ? rawDna.colors : [],
          visual_traits: Array.isArray(rawDna.visual_traits) ? rawDna.visual_traits : [],
          ux_traits: Array.isArray(rawDna.ux_traits) ? rawDna.ux_traits : [],
          meme_exaggeration: Array.isArray(rawDna.meme_exaggeration) ? rawDna.meme_exaggeration : [],
          iconic_elements: Array.isArray(rawDna.iconic_elements) ? rawDna.iconic_elements : [],
          behavioral_stereotypes: Array.isArray(rawDna.behavioral_stereotypes) ? rawDna.behavioral_stereotypes : [],
          satirical_patterns: Array.isArray(rawDna.satirical_patterns) ? rawDna.satirical_patterns : [],
        }
      : EMPTY_STYLE_DNA,
    archetype: rawArch
      ? {
          type: typeof rawArch.type === "string" ? rawArch.type : "",
          sections: Array.isArray(rawArch.sections) ? rawArch.sections : [],
          layout: typeof rawArch.layout === "string" ? rawArch.layout : "",
          content_style: Array.isArray(rawArch.content_style) ? rawArch.content_style : [],
        }
      : EMPTY_ARCHETYPE,
    logoPath: (row.logo_path as string) ?? null,
  };
}

/**
 * Fetch a single company profile by its slug id.
 * Returns null if not found.
 */
export async function getCompanyProfileById(
  id: string,
): Promise<CompanyProfile | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data) : null;
}

/**
 * List all company ids, ordered alphabetically by name.
 */
export async function listCompanyIds(): Promise<string[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("company_profiles")
    .select("id")
    .order("name");

  if (error) throw error;
  return (data ?? []).map((r: { id: string }) => r.id);
}

/**
 * Fetch all company profiles, ordered alphabetically by name.
 */
export async function getAllCompanyProfiles(): Promise<CompanyProfile[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .order("name");

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/**
 * Fetch screenshot image paths for a given company, ordered by sort_order.
 */
export async function getCompanyScreenshots(
  companyId: string,
): Promise<string[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("company_screenshots")
    .select("image_path")
    .eq("company_id", companyId)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []).map((r: { image_path: string }) => r.image_path);
}
