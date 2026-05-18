import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireSuperadmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }

  const supabase = createSupabaseServiceClient();

  const { data: products, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("profile_type", "product")
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: "Failed to load products", detail: error.message },
      { status: 500 },
    );
  }

  const result = (products ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    parentCompanyId: row.parent_company_id ?? null,
    category: row.category ?? "",
    profileType: row.profile_type ?? "product",
    popularityTier: row.popularity_tier ?? 2,
    researchStatus: row.research_status ?? "seed",
    memeStrength: row.meme_strength ?? 3,
    sourceUrls: Array.isArray(row.source_urls) ? row.source_urls : [],
    styleDna: row.style_dna ?? {},
    archetype: row.archetype ?? {},
    defaultVibeTags: Array.isArray(row.default_vibe_tags) ? row.default_vibe_tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return NextResponse.json(result);
}
