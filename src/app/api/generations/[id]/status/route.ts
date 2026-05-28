import { NextResponse } from "next/server";

import { recoverStaleGenerationById } from "@/lib/generation/recover-stale-generation";
import { toGenerationStatusResponse } from "@/lib/generation/status-response";
import { parseGenerationIdParam } from "@/lib/parse-generation-id";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/generations/[id]/status
 * Owner-only status for polling generation completion.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id: idStr } = await context.params;
  const id = parseGenerationIdParam(idStr);
  if (id == null) {
    return NextResponse.json({ error: "Invalid generation id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loadRow = async () => {
    const { data, error } = await supabase
      .from("generations")
      .select(
        "id, slug, status, builder, target, error_message, image_path, image_ready, creator_id, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    return { data, error };
  };

  const { data: row, error } = await loadRow();

  if (error || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (row.status === "queued" || row.status === "processing") {
    void recoverStaleGenerationById(id);
  }

  return NextResponse.json(toGenerationStatusResponse(row));
}
