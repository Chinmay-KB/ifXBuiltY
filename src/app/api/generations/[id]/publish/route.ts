import { NextResponse } from "next/server";

import { parseGenerationIdParam } from "@/lib/parse-generation-id";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
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

  const { data: row, error: selErr } = await supabase
    .from("generations")
    .select("id, slug, visibility, image_path, creator_id")
    .eq("id", id)
    .maybeSingle();

  if (selErr || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (row.visibility === "published") {
    return NextResponse.json({
      ok: true,
      id,
      slug: row.slug,
      visibility: "published" as const,
    });
  }

  if (!row.image_path?.trim()) {
    return NextResponse.json(
      { error: "Cannot publish without an image", code: "missing_image" },
      { status: 400 },
    );
  }

  const { error: upErr } = await supabase
    .from("generations")
    .update({ visibility: "published" })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (upErr) {
    return NextResponse.json(
      { error: "Could not publish", detail: upErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    id,
    slug: row.slug,
    visibility: "published" as const,
  });
}
