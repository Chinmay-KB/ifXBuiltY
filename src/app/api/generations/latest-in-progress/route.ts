import { NextResponse } from "next/server";

import { toGenerationStatusResponse } from "@/lib/generation/status-response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/generations/latest-in-progress
 * Returns the owner's most recent queued/processing generation, if any.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("generations")
    .select(
      "id, slug, status, builder, target, error_message, image_path, creator_id",
    )
    .eq("creator_id", user.id)
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Could not load generation", detail: error.message },
      { status: 500 },
    );
  }

  if (!row) {
    return NextResponse.json({ item: null });
  }

  return NextResponse.json({ item: toGenerationStatusResponse(row) });
}
