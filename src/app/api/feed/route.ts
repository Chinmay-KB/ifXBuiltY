import { NextResponse } from "next/server";

import { asGenerationsSelectClient } from "@/lib/feed-client";
import { queryFeed } from "@/lib/feed-query";
import {
  parseCommaSeparated,
  parseFeedLimit,
  parseFeedOffset,
  parseFeedSort,
} from "@/lib/feed-url-params";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sort = parseFeedSort(url.searchParams.get("sort"));
  const limit = parseFeedLimit(url.searchParams.get("limit"));
  const offset = parseFeedOffset(url.searchParams.get("offset"));
  const builders = parseCommaSeparated(url.searchParams.get("builder"));
  const targets = parseCommaSeparated(url.searchParams.get("target"));
  const tones = parseCommaSeparated(url.searchParams.get("tone"));

  const supabase = await createSupabaseServerClient();

  try {
    const feed = await queryFeed(
      asGenerationsSelectClient(supabase),
      {
        sort,
        limit,
        offset,
        builders,
        targets,
        tones,
      },
    );

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
