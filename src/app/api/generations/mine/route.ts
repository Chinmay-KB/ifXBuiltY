import { NextResponse } from "next/server";

import { generationMediaPath } from "@/lib/generation-media-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/generations/mine
 * Returns the authenticated user's generations with status.
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  const limit = Math.min(
    Math.max(1, Number(limitParam) || 20),
    50,
  );
  const offset = Math.max(0, Number(offsetParam) || 0);

  const { data: rows, error } = await supabase
    .from("generations")
    .select(
      "id, slug, builder, target, tone, screen_type, region, extra_details, image_path, image_ready, visibility, status, error_message, upvote_count, downvote_count, net_score, remix_count, created_at",
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    return NextResponse.json(
      { error: "Could not load generations", detail: error.message },
      { status: 500 },
    );
  }

  const allRows = rows ?? [];
  const hasMore = allRows.length > limit;
  const list = hasMore ? allRows.slice(0, limit) : allRows;

  const items = list.map((r) => {
    const hasDisplayableImage =
      r.status === "completed" &&
      r.image_ready === true &&
      Boolean(r.image_path?.trim());
    return {
      id: r.id,
      slug: r.slug,
      builder: r.builder,
      target: r.target,
      tone: r.tone,
      screenType: r.screen_type,
      region: r.region,
      extraDetails: r.extra_details,
      imageUrl: hasDisplayableImage ? generationMediaPath(r.slug, "card") : null,
      imagePath: r.image_path,
      imageReady: r.image_ready === true,
      visibility: r.visibility,
      status: r.status,
      errorMessage: r.error_message,
      upvoteCount: r.upvote_count,
      downvoteCount: r.downvote_count,
      netScore: r.net_score,
      remixCount: r.remix_count,
      createdAt: r.created_at,
    };
  });

  return NextResponse.json({ items, hasMore });
}
