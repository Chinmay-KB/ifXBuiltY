import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sanitizeVibeTags } from "@/lib/vibe-tags";

export const runtime = "nodejs";

/**
 * GET /api/admin/companies
 * Returns all company profiles ordered by name, with screenshot counts.
 */
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

  const { data: companies, error: companiesErr } = await supabase
    .from("company_profiles")
    .select("*")
    .order("name");

  if (companiesErr) {
    return NextResponse.json(
      { error: "Failed to load companies", detail: companiesErr.message },
      { status: 500 },
    );
  }

  // Get screenshot counts per company
  const { data: counts, error: countsErr } = await supabase
    .from("company_screenshots")
    .select("company_id");

  if (countsErr) {
    return NextResponse.json(
      { error: "Failed to load screenshot counts", detail: countsErr.message },
      { status: 500 },
    );
  }

  // Build a map of company_id → count
  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    const id = row.company_id as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  const result = (companies ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    styleDna: row.style_dna ?? {},
    archetype: row.archetype ?? {},
    logoPath: row.logo_path ?? null,
    defaultVibeTags: Array.isArray(row.default_vibe_tags) ? row.default_vibe_tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    screenshotCount: countMap.get(row.id) ?? 0,
    profileType: row.profile_type ?? "company",
    parentCompanyId: row.parent_company_id ?? null,
    category: row.category ?? "",
    researchStatus: row.research_status ?? "approved",
    popularityTier: row.popularity_tier ?? 2,
    memeStrength: row.meme_strength ?? 3,
  }));

  return NextResponse.json(result);
}

// --- POST validation ---

const SLUG_REGEX = /^[a-z0-9-]+$/;
const MAX_SLUG_LENGTH = 60;

type CreateCompanyBody = {
  id?: unknown;
  name?: unknown;
  styleDna?: unknown;
  archetype?: unknown;
  defaultVibeTags?: unknown;
};

function validateCreateBody(body: CreateCompanyBody): string | null {
  // id is required
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

  // name is required
  if (body.name == null || typeof body.name !== "string" || body.name.trim() === "") {
    return 'Field "name" is required and must be a non-empty string';
  }
  if (body.name.trim().length > 100) {
    return 'Field "name" must be at most 100 characters';
  }

  // styleDna must be an object if provided
  if (body.styleDna != null && (typeof body.styleDna !== "object" || Array.isArray(body.styleDna))) {
    return 'Field "styleDna" must be a JSON object';
  }

  // archetype must be an object if provided
  if (body.archetype != null && (typeof body.archetype !== "object" || Array.isArray(body.archetype))) {
    return 'Field "archetype" must be a JSON object';
  }

  return null;
}

/**
 * POST /api/admin/companies
 * Creates a new company profile.
 */
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

  let body: CreateCompanyBody;
  try {
    body = (await request.json()) as CreateCompanyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateCreateBody(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const id = (body.id as string).trim();
  const name = (body.name as string).trim();
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
      style_dna: styleDna,
      archetype,
      default_vibe_tags: defaultVibeTags,
    })
    .select("*")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json(
        { error: "A company with this slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create company", detail: insertErr.message },
      { status: 500 },
    );
  }

  const result = {
    id: inserted.id,
    name: inserted.name,
    styleDna: inserted.style_dna,
    archetype: inserted.archetype,
    logoPath: inserted.logo_path ?? null,
    defaultVibeTags: Array.isArray(inserted.default_vibe_tags) ? inserted.default_vibe_tags : [],
    createdAt: inserted.created_at,
    updatedAt: inserted.updated_at,
  };

  return NextResponse.json(result, { status: 201 });
}
