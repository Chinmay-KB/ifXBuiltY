import { NextResponse } from "next/server";

import { revalidateSelectableCompanyGroups } from "@/data/company-profiles";
import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sanitizeVibeTags } from "@/lib/vibe-tags";

const RESEARCH_STATUSES = [
  "seed",
  "researched",
  "reviewed",
  "approved",
  "rejected",
] as const;

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    parentCompanyId: data.parent_company_id ?? null,
    category: data.category ?? "",
    profileType: data.profile_type ?? "product",
    popularityTier: data.popularity_tier ?? 2,
    researchStatus: data.research_status ?? "seed",
    memeStrength: data.meme_strength ?? 3,
    sourceUrls: Array.isArray(data.source_urls) ? data.source_urls : [],
    styleDna: data.style_dna ?? {},
    archetype: data.archetype ?? {},
    defaultVibeTags: Array.isArray(data.default_vibe_tags) ? data.default_vibe_tags : [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}

type UpdateProductBody = {
  name?: unknown;
  parentCompanyId?: unknown;
  category?: unknown;
  popularityTier?: unknown;
  memeStrength?: unknown;
  styleDna?: unknown;
  archetype?: unknown;
  defaultVibeTags?: unknown;
  sourceUrls?: unknown;
  researchStatus?: unknown;
};

function validateUpdateBody(body: UpdateProductBody): string | null {
  if (body.name != null && (typeof body.name !== "string" || body.name.trim() === "")) {
    return 'Field "name" must be a non-empty string';
  }
  if (body.popularityTier != null && ![1, 2, 3].includes(body.popularityTier as number)) {
    return 'Field "popularityTier" must be 1, 2, or 3';
  }
  if (body.memeStrength != null && (body.memeStrength as number) < 1 || (body.memeStrength as number) > 5) {
    return 'Field "memeStrength" must be between 1 and 5';
  }
  if (body.styleDna != null && (typeof body.styleDna !== "object" || Array.isArray(body.styleDna))) {
    return 'Field "styleDna" must be a JSON object';
  }
  if (body.archetype != null && (typeof body.archetype !== "object" || Array.isArray(body.archetype))) {
    return 'Field "archetype" must be a JSON object';
  }
  if (
    body.researchStatus != null &&
    (typeof body.researchStatus !== "string" ||
      !(RESEARCH_STATUSES as readonly string[]).includes(body.researchStatus))
  ) {
    return `Field "researchStatus" must be one of ${RESEARCH_STATUSES.join(", ")}`;
  }
  return null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;

  let body: UpdateProductBody;
  try {
    body = (await request.json()) as UpdateProductBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateUpdateBody(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = (body.name as string).trim();
  if (body.parentCompanyId != null) updates.parent_company_id = body.parentCompanyId as string | null;
  if (body.category != null) updates.category = body.category as string;
  if (body.popularityTier != null) updates.popularity_tier = body.popularityTier as number;
  if (body.memeStrength != null) updates.meme_strength = body.memeStrength as number;
  if (body.styleDna != null) updates.style_dna = body.styleDna as Record<string, unknown>;
  if (body.archetype != null) updates.archetype = body.archetype as Record<string, unknown>;
  if (body.defaultVibeTags != null) updates.default_vibe_tags = sanitizeVibeTags(body.defaultVibeTags as string[]);
  if (body.sourceUrls != null) updates.source_urls = body.sourceUrls as string[];
  if (body.researchStatus != null) updates.research_status = body.researchStatus as string;

  const { data, error } = await supabase
    .from("company_profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update product", detail: error.message },
      { status: 500 },
    );
  }

  revalidateSelectableCompanyGroups();

  return NextResponse.json({
    id: data.id,
    name: data.name,
    parentCompanyId: data.parent_company_id ?? null,
    category: data.category ?? "",
    profileType: data.profile_type ?? "product",
    popularityTier: data.popularity_tier ?? 2,
    researchStatus: data.research_status ?? "seed",
    memeStrength: data.meme_strength ?? 3,
    sourceUrls: Array.isArray(data.source_urls) ? data.source_urls : [],
    styleDna: data.style_dna ?? {},
    archetype: data.archetype ?? {},
    defaultVibeTags: Array.isArray(data.default_vibe_tags) ? data.default_vibe_tags : [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const { error } = await supabase
    .from("company_profiles")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete product", detail: error.message },
      { status: 500 },
    );
  }

  revalidateSelectableCompanyGroups();

  return NextResponse.json({ success: true });
}
