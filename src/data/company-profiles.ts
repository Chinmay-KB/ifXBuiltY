import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { unstable_cache } from "next/cache";

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
  defaultVibeTags: string[];
  /** Parent company id for products; null for company-level profiles */
  parentCompanyId: string | null;
  /** 'company' or 'product' */
  profileType: 'company' | 'product';
  /** Product category: search, video, maps, payments, etc. */
  category: string;
  /** 1 = core, 2 = strong, 3 = niche-but-memeable */
  popularityTier: number;
  /** seed, researched, reviewed, approved, rejected */
  researchStatus: string;
  /** Meme potential score 1-5 */
  memeStrength: number;
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
    defaultVibeTags: Array.isArray(row.default_vibe_tags) ? (row.default_vibe_tags as string[]) : [],
    parentCompanyId: (row.parent_company_id as string) ?? null,
    profileType: (row.profile_type as 'company' | 'product') ?? 'company',
    category: (row.category as string) ?? '',
    popularityTier: (row.popularity_tier as number) ?? 2,
    researchStatus: (row.research_status as string) ?? 'approved',
    memeStrength: (row.meme_strength as number) ?? 3,
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

export type CompanyGroup = {
  company: CompanyProfile;
  products: CompanyProfile[];
};

const SELECTABLE_COMPANY_PROFILES_SELECT =
  "id, name, archetype, logo_path, default_vibe_tags, parent_company_id, profile_type, category, popularity_tier, research_status, meme_strength";

/**
 * Fetch all profiles grouped by parent company.
 * Companies with no products still appear with an empty products array.
 */
export async function getAllCompanyGroups(): Promise<CompanyGroup[]> {
  const all = await getAllCompanyProfiles();
  const companies = all.filter((p) => p.profileType === "company");
  const products = all.filter((p) => p.profileType === "product");

  const groups: CompanyGroup[] = companies.map((company) => ({
    company,
    products: products
      .filter((p) => p.parentCompanyId === company.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  return groups.sort((a, b) => a.company.name.localeCompare(b.company.name));
}

/**
 * List all selectable profile ids (companies + approved products).
 * Used by the picker and random pairing logic.
 */
export async function listSelectableProfileIds(): Promise<string[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("company_profiles")
    .select("id")
    .or("profile_type.eq.company,and(profile_type.eq.product,research_status.eq.approved)")
    .order("name");

  if (error) throw error;
  return (data ?? []).map((r: { id: string }) => r.id);
}

export type SelectableProfileLookup = {
  id: string;
  name: string;
};

/**
 * Slug + display name for selectable picker nouns (companies + approved products).
 * Used by the ops mashup CLI; catalog JSON is not a live source.
 */
export async function listSelectableProfileLookups(): Promise<
  SelectableProfileLookup[]
> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("company_profiles")
    .select("id, name")
    .or(
      "profile_type.eq.company,and(profile_type.eq.product,research_status.eq.approved)",
    )
    .order("name");

  if (error) throw error;
  return (data ?? []).map((r: { id: string; name: string }) => ({
    id: r.id,
    name: r.name,
  }));
}

/**
 * Groups for the generator picker: all companies plus approved products only.
 */
export async function getSelectableCompanyGroups(): Promise<CompanyGroup[]> {
  return unstable_cache(
    async () => {
      const supabase = createSupabaseServiceClient();
      const { data, error } = await supabase
        .from("company_profiles")
        .select(SELECTABLE_COMPANY_PROFILES_SELECT)
        .or(
          "profile_type.eq.company,and(profile_type.eq.product,research_status.eq.approved)",
        )
        .order("name");

      if (error) throw error;
      const all = (data ?? []).map(mapRow);
      const companies = all.filter((p) => p.profileType === "company");
      const products = all.filter((p) => p.profileType === "product");

      return companies
        .map((company) => ({
          company,
          products: products
            .filter((p) => p.parentCompanyId === company.id)
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.company.name.localeCompare(b.company.name));
    },
    ["selectable-company-groups-v2"],
    { revalidate: 60 * 60 },
  )();
}
