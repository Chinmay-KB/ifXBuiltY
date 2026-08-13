import { NextResponse } from "next/server";

import { revalidateSelectableCompanyGroups } from "@/data/company-profiles";
import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sanitizeVibeTags } from "@/lib/vibe-tags";

export const runtime = "nodejs";

const SLUG_REGEX = /^[a-z0-9-]+$/;
const MAX_SLUG_LENGTH = 60;

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

type CreateProductBody = {
  id?: unknown;
  name?: unknown;
  parentCompanyId?: unknown;
  category?: unknown;
  popularityTier?: unknown;
  memeStrength?: unknown;
  styleDna?: unknown;
  archetype?: unknown;
  defaultVibeTags?: unknown;
};

function validateCreateBody(body: CreateProductBody): string | null {
  if (body.id == null || typeof body.id !== "string" || body.id.trim() === "") {
    return 'Field "id" is required and must be a non-empty string';
  }
  const id = body.id.trim();
  if (id.length > MAX_SLUG_LENGTH) {
    return `Field "id" must be at most ${MAX_SLUG_LENGTH} characters`;
  }
  if (!SLUG_REGEX.test(id)) {
    return 'Field "id" must contain only lowercase letters, numbers, and hyphens';
  }

  if (body.name == null || typeof body.name !== "string" || body.name.trim() === "") {
    return 'Field "name" is required and must be a non-empty string';
  }
  if (body.name.trim().length > 100) {
    return 'Field "name" must be at most 100 characters';
  }

  if (
    body.popularityTier != null &&
    ![1, 2, 3].includes(body.popularityTier as number)
  ) {
    return 'Field "popularityTier" must be 1, 2, or 3';
  }

  if (body.memeStrength != null) {
    const strength = body.memeStrength as number;
    if (strength < 1 || strength > 5) {
      return 'Field "memeStrength" must be between 1 and 5';
    }
  }

  if (
    body.styleDna != null &&
    (typeof body.styleDna !== "object" || Array.isArray(body.styleDna))
  ) {
    return 'Field "styleDna" must be a JSON object';
  }

  if (
    body.archetype != null &&
    (typeof body.archetype !== "object" || Array.isArray(body.archetype))
  ) {
    return 'Field "archetype" must be a JSON object';
  }

  return null;
}

export async function POST(request: Request) {
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

  let body: CreateProductBody;
  try {
    body = (await request.json()) as CreateProductBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateCreateBody(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const id = (body.id as string).trim();
  const name = (body.name as string).trim();
  const parentCompanyId =
    body.parentCompanyId != null && typeof body.parentCompanyId === "string"
      ? body.parentCompanyId.trim() || null
      : null;
  const category =
    body.category != null && typeof body.category === "string"
      ? body.category.trim()
      : "";
  const popularityTier =
    body.popularityTier != null ? (body.popularityTier as number) : 2;
  const memeStrength =
    body.memeStrength != null ? (body.memeStrength as number) : 3;
  const styleDna = (body.styleDna as Record<string, unknown>) ?? {};
  const archetype = (body.archetype as Record<string, unknown>) ?? {};
  const defaultVibeTags = Array.isArray(body.defaultVibeTags)
    ? sanitizeVibeTags(body.defaultVibeTags)
    : [];

  const supabase = createSupabaseServiceClient();

  const { data: inserted, error: insertErr } = await supabase
    .from("company_profiles")
    .insert({
      id,
      name,
      profile_type: "product",
      research_status: "seed",
      parent_company_id: parentCompanyId,
      category,
      popularity_tier: popularityTier,
      meme_strength: memeStrength,
      style_dna: styleDna,
      archetype,
      default_vibe_tags: defaultVibeTags,
      source_urls: [],
    })
    .select("*")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create product", detail: insertErr.message },
      { status: 500 },
    );
  }

  revalidateSelectableCompanyGroups();

  return NextResponse.json(
    {
      id: inserted.id,
      name: inserted.name,
      parentCompanyId: inserted.parent_company_id ?? null,
      category: inserted.category ?? "",
      profileType: inserted.profile_type ?? "product",
      popularityTier: inserted.popularity_tier ?? 2,
      researchStatus: inserted.research_status ?? "seed",
      memeStrength: inserted.meme_strength ?? 3,
      sourceUrls: Array.isArray(inserted.source_urls) ? inserted.source_urls : [],
      styleDna: inserted.style_dna ?? {},
      archetype: inserted.archetype ?? {},
      defaultVibeTags: Array.isArray(inserted.default_vibe_tags)
        ? inserted.default_vibe_tags
        : [],
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
    },
    { status: 201 },
  );
}
