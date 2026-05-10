import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_FILE_SIZE = 5_242_880; // 5 MB
const MAX_SCREENSHOTS_PER_COMPANY = 10;

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "png";
  }
}

/**
 * POST /api/admin/companies/[id]/screenshots
 * Upload a screenshot for a company.
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: companyId } = await params;
  const supabase = createSupabaseServiceClient();

  // Verify company exists
  const { data: company, error: companyErr } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("id", companyId)
    .maybeSingle();

  if (companyErr) {
    return NextResponse.json(
      { error: "Failed to verify company" },
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
  if (
    !ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])
  ) {
    return NextResponse.json(
      { error: "Invalid file format. Allowed: PNG, JPEG, WebP" },
      { status: 400 },
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 5 MB limit" },
      { status: 400 },
    );
  }

  // Check current screenshot count
  const { count, error: countErr } = await supabase
    .from("company_screenshots")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (countErr) {
    return NextResponse.json(
      { error: "Failed to check screenshot count" },
      { status: 500 },
    );
  }

  if ((count ?? 0) >= MAX_SCREENSHOTS_PER_COMPANY) {
    return NextResponse.json(
      { error: "Maximum of 10 screenshots per company reached" },
      { status: 400 },
    );
  }

  // Upload to storage
  const ext = extFromMime(file.type);
  const uuid = randomUUID();
  const storagePath = `${companyId}/${uuid}.${ext}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from("company-screenshots")
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    return NextResponse.json(
      { error: "Failed to upload screenshot" },
      { status: 500 },
    );
  }

  // Determine sort_order (append at end)
  const nextSortOrder = (count ?? 0);

  // Insert row into company_screenshots
  const { data: row, error: insertErr } = await supabase
    .from("company_screenshots")
    .insert({
      company_id: companyId,
      image_path: storagePath,
      sort_order: nextSortOrder,
    })
    .select("id, company_id, image_path, sort_order, created_at")
    .single();

  if (insertErr) {
    // Clean up uploaded file on DB insert failure
    await supabase.storage.from("company-screenshots").remove([storagePath]);
    return NextResponse.json(
      { error: "Failed to save screenshot record" },
      { status: 500 },
    );
  }

  return NextResponse.json(row, { status: 201 });
}

/**
 * GET /api/admin/companies/[id]/screenshots
 * List all screenshots for a company with signed URLs.
 */
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: companyId } = await params;
  const supabase = createSupabaseServiceClient();

  // Verify company exists
  const { data: company, error: companyErr } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("id", companyId)
    .maybeSingle();

  if (companyErr) {
    return NextResponse.json(
      { error: "Failed to verify company" },
      { status: 500 },
    );
  }

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Fetch screenshots
  const { data: screenshots, error: fetchErr } = await supabase
    .from("company_screenshots")
    .select("id, company_id, image_path, sort_order, created_at")
    .eq("company_id", companyId)
    .order("sort_order");

  if (fetchErr) {
    return NextResponse.json(
      { error: "Failed to fetch screenshots" },
      { status: 500 },
    );
  }

  // Create signed URLs for each screenshot (1 hour expiry)
  const screenshotsWithUrls = await Promise.all(
    (screenshots ?? []).map(async (s) => {
      const { data: signed } = await supabase.storage
        .from("company-screenshots")
        .createSignedUrl(s.image_path, 3600);

      return {
        ...s,
        signedUrl: signed?.signedUrl ?? null,
      };
    }),
  );

  return NextResponse.json(screenshotsWithUrls);
}
