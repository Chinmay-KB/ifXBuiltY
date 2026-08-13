import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { revalidateSelectableCompanyGroups } from "@/data/company-profiles";
import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sanitizeVibeTags } from "@/lib/vibe-tags";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// PUT /api/admin/companies/[id]
// ---------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/companies/[id]">,
) {
  try {
    await requireSuperadmin();

    const { id } = await ctx.params;
    const body = await request.json();

    // Build update object from allowed fields
    const updates: Record<string, unknown> = {};

    if ("name" in body) {
      if (typeof body.name !== "string") {
        return NextResponse.json({ error: "name must be a string" }, { status: 400 });
      }
      if (body.name.length > 100) {
        return NextResponse.json({ error: "name exceeds maximum length of 100" }, { status: 400 });
      }
      updates.name = body.name;
    }

    if ("styleDna" in body) {
      if (body.styleDna != null && (typeof body.styleDna !== "object" || Array.isArray(body.styleDna))) {
        return NextResponse.json({ error: "styleDna must be a JSON object" }, { status: 400 });
      }
      updates.style_dna = body.styleDna ?? {};
    }

    if ("archetype" in body) {
      if (body.archetype != null && (typeof body.archetype !== "object" || Array.isArray(body.archetype))) {
        return NextResponse.json({ error: "archetype must be a JSON object" }, { status: 400 });
      }
      updates.archetype = body.archetype ?? {};
    }

    if ("defaultVibeTags" in body) {
      if (!Array.isArray(body.defaultVibeTags)) {
        return NextResponse.json({ error: "defaultVibeTags must be an array of strings" }, { status: 400 });
      }
      updates.default_vibe_tags = sanitizeVibeTags(body.defaultVibeTags);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();

    // Check company exists
    const { data: existing, error: fetchError } = await supabase
      .from("company_profiles")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch company", detail: fetchError.message },
        { status: 500 },
      );
    }

    if (!existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Update company
    const { data: updated, error: updateError } = await supabase
      .from("company_profiles")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update company", detail: updateError.message },
        { status: 500 },
      );
    }

    revalidateSelectableCompanyGroups();

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      styleDna: updated.style_dna,
      archetype: updated.archetype,
      logoPath: updated.logo_path,
      defaultVibeTags: Array.isArray(updated.default_vibe_tags) ? updated.default_vibe_tags : [],
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/companies/[id]
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/admin/companies/[id]">,
) {
  try {
    await requireSuperadmin();

    const { id } = await ctx.params;
    const supabase = createSupabaseServiceClient();

    // Check company exists and get logo_path
    const { data: company, error: fetchError } = await supabase
      .from("company_profiles")
      .select("id, logo_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch company", detail: fetchError.message },
        { status: 500 },
      );
    }

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get all screenshot paths for this company
    const { data: screenshots } = await supabase
      .from("company_screenshots")
      .select("image_path")
      .eq("company_id", id);

    // Remove screenshot files from storage
    const screenshotPaths = (screenshots ?? []).map((s) => s.image_path);
    if (screenshotPaths.length > 0) {
      await supabase.storage.from("company-screenshots").remove(screenshotPaths);
    }

    // Remove logo file from storage
    if (company.logo_path) {
      await supabase.storage.from("company-logos").remove([company.logo_path]);
    }

    // Delete company row (cascades to company_screenshots via FK)
    const { error: deleteError } = await supabase
      .from("company_profiles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete company", detail: deleteError.message },
        { status: 500 },
      );
    }

    revalidateSelectableCompanyGroups();

    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
