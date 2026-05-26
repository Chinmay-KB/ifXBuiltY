import { NextResponse } from "next/server";

import {
  FEED_DEFAULT_LIMIT,
  FEED_MAX_LIMIT,
} from "@/lib/constants";
import type { GenerationsSelectClient } from "@/lib/feed-public-filters";
import { queryFeed } from "@/lib/feed-query";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SortKey = "newest" | "trending" | "top" | "remixes";

function parseSort(raw: string | null): SortKey {
  if (raw === "trending") return "trending";
  if (raw === "top") return "top";
  if (raw === "remixes") return "remixes";
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
  const tones = parseCommaSeparated(url.searchParams.get("tone"));

  const supabase = await createSupabaseServerClient();

  try {
    const feed = await queryFeed(supabase as unknown as GenerationsSelectClient, {
      sort,
      limit,
      offset,
      builders,
      targets,
      tones,
    });

    return NextResponse.json(feed);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not load feed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
