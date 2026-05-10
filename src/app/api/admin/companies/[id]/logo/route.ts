import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const MAX_FILE_SIZE = 2097152; // 2 MB

const BUCKET = "company-logos";

/**
 * POST /api/admin/companies/[id]/logo
 * Upload or replace the company logo.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperadmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const { id: companyId } = await params;
  const supabase = createSupabaseServiceClient();

  // Verify company exists
  const { data: company, error: companyErr } = await supabase
    .from("company_profiles")
    .select("id, logo_path")
    .eq("id", companyId)
    .maybeSingle();

  if (companyErr) {
    return NextResponse.json(
      { error: "Failed to query company" },
      { status: 500 },
    );
  }

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 },
    );
  }

  // Validate MIME type
  const ext = ALLOWED_MIME_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      {
        error: `Invalid file format. Allowed: PNG, JPEG, WebP, SVG`,
      },
      { status: 400 },
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 2 MB limit" },
      { status: 400 },
    );
  }

  // Delete previous logo if exists
  if (company.logo_path) {
    await supabase.storage.from(BUCKET).remove([company.logo_path]);
  }

  // Upload new logo
  const storagePath = `${companyId}/logo.${ext}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadErr) {
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 },
    );
  }

  // Update company_profiles.logo_path
  const { error: updateErr } = await supabase
    .from("company_profiles")
    .update({ logo_path: storagePath })
    .eq("id", companyId);

  if (updateErr) {
    // Attempt to clean up the uploaded file
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: "Failed to update company logo path" },
      { status: 500 },
    );
  }

  // Generate a signed URL for preview
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  return NextResponse.json({
    logoPath: storagePath,
    signedUrl: signed?.signedUrl ?? null,
  });
}

/**
 * DELETE /api/admin/companies/[id]/logo
 * Remove the company logo.
 */
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
    throw e;
  }

  const { id: companyId } = await params;
  const supabase = createSupabaseServiceClient();

  // Get current logo_path
  const { data: company, error: companyErr } = await supabase
    .from("company_profiles")
    .select("id, logo_path")
    .eq("id", companyId)
    .maybeSingle();

  if (companyErr) {
    return NextResponse.json(
      { error: "Failed to query company" },
      { status: 500 },
    );
  }

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  if (!company.logo_path) {
    return NextResponse.json(
      { error: "No logo exists for this company" },
      { status: 404 },
    );
  }

  // Remove file from storage
  await supabase.storage.from(BUCKET).remove([company.logo_path]);

  // Null out logo_path
  const { error: updateErr } = await supabase
    .from("company_profiles")
    .update({ logo_path: null })
    .eq("id", companyId);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to update company record" },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
