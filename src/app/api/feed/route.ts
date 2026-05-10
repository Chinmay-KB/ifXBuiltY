import { NextResponse } from "next/server";

import {
  FEED_DEFAULT_LIMIT,
  FEED_MAX_LIMIT,
} from "@/lib/constants";
import { generationMediaPath } from "@/lib/generation-media-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SortKey = "newest" | "trending" | "top";

function parseSort(raw: string | null): SortKey {
  if (raw === "trending") return "trending";
  if (raw === "top") return "top";
  return "newest";
}

function parseLimit(raw: string | null): number {
  if (raw == null || raw === "") return FEED_DEFAULT_LIMIT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return FEED_DEFAULT_LIMIT;
  return Math.min(Math.floor(n), FEED_MAX_LIMIT);
}

function parseOffset(raw: string | null): number {
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function parseCommaSeparated(raw: string | null): string[] {
  if (raw == null || raw.trim() === "") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sort = parseSort(url.searchParams.get("sort"));
  const limit = parseLimit(url.searchParams.get("limit"));
  const offset = parseOffset(url.searchParams.get("offset"));
  const builders = parseCommaSeparated(url.searchParams.get("builder"));
  const targets = parseCommaSeparated(url.searchParams.get("target"));

  const supabase = await createSupabaseServerClient();

  // Fetch limit+1 to determine if more records exist beyond this page
  let q = supabase
    .from("generations")
    .select(
      "id, slug, builder, target, tone, screen_type, region, extra_details, image_path, upvote_count, downvote_count, net_score, remix_count, created_at",
    )
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .range(offset, offset + limit); // fetches limit+1 rows (range is inclusive)

  // Apply builder filter
  if (builders.length > 0) {
    q = q.in("builder", builders);
  }

  // Apply target filter
  if (targets.length > 0) {
    q = q.in("target", targets);
  }

  // Apply sort order
  if (sort === "trending") {
    q = q
      .order("net_score", { ascending: false })
      .order("created_at", { ascending: false });
  } else if (sort === "top") {
    q = q.order("net_score", { ascending: false });
  } else {
    // newest
    q = q.order("created_at", { ascending: false });
  }

  const { data: rows, error } = await q;

  if (error) {
    return NextResponse.json(
      { error: "Could not load feed", detail: error.message },
      { status: 500 },
    );
  }

  const allRows = rows ?? [];

  // Determine hasMore: if we got more than `limit` rows, there are more pages
  const hasMore = allRows.length > limit;
  const list = hasMore ? allRows.slice(0, limit) : allRows;

  if (list.length === 0) {
    return NextResponse.json({ sort, items: [], hasMore: false });
  }

  const items = list.map((r) => ({
    id: r.id,
    slug: r.slug,
    builder: r.builder,
    target: r.target,
    tone: r.tone,
    screenType: r.screen_type,
    region: r.region,
    extraDetails: r.extra_details,
    imageUrl: r.image_path ? generationMediaPath(r.slug, "card") : null,
    imagePath: r.image_path,
    upvoteCount: r.upvote_count,
    downvoteCount: r.downvote_count,
    netScore: r.net_score,
    remixCount: r.remix_count,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ sort, items, hasMore });
}
