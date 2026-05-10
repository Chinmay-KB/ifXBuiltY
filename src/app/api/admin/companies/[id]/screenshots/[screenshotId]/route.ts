import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * DELETE /api/admin/companies/[id]/screenshots/[screenshotId]
 * Remove a screenshot from storage and delete the database row.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; screenshotId: string }> },
) {
  try {
    await requireSuperadmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: companyId, screenshotId } = await params;
  const supabase = createSupabaseServiceClient();

  // Find the screenshot row by id and company_id
  const { data: screenshot, error: fetchErr } = await supabase
    .from("company_screenshots")
    .select("id, image_path")
    .eq("id", screenshotId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json(
      { error: "Failed to fetch screenshot" },
      { status: 500 },
    );
  }

  if (!screenshot) {
    return NextResponse.json(
      { error: "Screenshot not found" },
      { status: 404 },
    );
  }

  // Remove file from storage
  const { error: removeErr } = await supabase.storage
    .from("company-screenshots")
    .remove([screenshot.image_path]);

  if (removeErr) {
    return NextResponse.json(
      { error: "Failed to remove screenshot file from storage" },
      { status: 500 },
    );
  }

  // Delete the database row
  const { error: deleteErr } = await supabase
    .from("company_screenshots")
    .delete()
    .eq("id", screenshotId)
    .eq("company_id", companyId);

  if (deleteErr) {
    return NextResponse.json(
      { error: "Failed to delete screenshot record" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
