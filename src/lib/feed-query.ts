import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { FEED_MAX_LIMIT } from "@/lib/constants";
import type { FeedResponse, FeedSort } from "@/lib/feed-types";
import { applyPublicFeedFilters } from "@/lib/feed-public-filters";
import { generationMediaPath } from "@/lib/generation-media-url";
import { tryGetSupabasePublicEnv } from "@/lib/supabase/public-env";
import { sanitizeVibeTags } from "@/lib/vibe-tags";

const HOMEPAGE_FEED_REVALIDATE_SECONDS = 2 * 60;

type FeedQueryOptions = {
  sort: FeedSort;
  limit: number;
  offset?: number;
  builders?: string[];
  targets?: string[];
  tones?: string[];
  includeIdeasThisWeek?: boolean;
};

type GenerationFeedRow = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  tone: string;
  vibe_tags: string[] | null;
  screen_type: string;
  region: string;
  extra_details: string;
  image_path: string | null;
  upvote_count: number;
  downvote_count: number;
  net_score: number;
  remix_count: number;
  created_at: string;
};

function createPublicSupabaseClient() {
  const env = tryGetSupabasePublicEnv();
  if (!env) return null;

  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit < 1) return FEED_MAX_LIMIT;
  return Math.min(Math.floor(limit), FEED_MAX_LIMIT);
}

function normalizeList(values: string[] | undefined): string[] {
  return values?.map((value) => value.trim()).filter(Boolean) ?? [];
}

export async function queryFeed(
  supabase: SupabaseClient,
  opts: FeedQueryOptions,
): Promise<FeedResponse> {
  const sort = opts.sort;
  const limit = clampLimit(opts.limit);
  const offset = Math.max(0, Math.floor(opts.offset ?? 0));
  const builders = normalizeList(opts.builders);
  const targets = normalizeList(opts.targets);
  const tones = sanitizeVibeTags(normalizeList(opts.tones));

  let q = applyPublicFeedFilters(
    supabase.from("generations").select(
      "id, slug, builder, target, tone, vibe_tags, screen_type, region, extra_details, image_path, upvote_count, downvote_count, net_score, remix_count, created_at",
    ),
  ).range(offset, offset + limit);

  if (builders.length > 0) {
    q = q.in("builder", builders);
  }

  if (targets.length > 0) {
    q = q.in("target", targets);
  }

  if (tones.length > 0) {
    q = q.overlaps("vibe_tags", tones);
  }

  if (sort === "trending") {
    q = q
      .order("net_score", { ascending: false })
      .order("created_at", { ascending: false });
  } else if (sort === "top") {
    q = q.order("net_score", { ascending: false });
  } else if (sort === "remixes") {
    q = q
      .order("remix_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const countPromise =
    opts.includeIdeasThisWeek === false
      ? Promise.resolve({ count: undefined, error: null })
      : applyPublicFeedFilters(
          supabase.from("generations").select("*", { count: "exact", head: true }),
        ).gte("created_at", weekAgoIso);

  const [{ data: rows, error }, countResult] = await Promise.all([
    q,
    countPromise,
  ]);

  if (error) {
    throw error;
  }

  const allRows = (rows ?? []) as GenerationFeedRow[];
  const hasMore = allRows.length > limit;
  const list = hasMore ? allRows.slice(0, limit) : allRows;
  const ideasThisWeek = countResult.count ?? 0;

  return {
    sort,
    items: list.map((row) => ({
      id: row.id,
      slug: row.slug,
      builder: row.builder,
      target: row.target,
      tone: row.tone,
      vibeTags: row.vibe_tags ?? [],
      screenType: row.screen_type,
      region: row.region,
      extraDetails: row.extra_details,
      imageUrl: row.image_path ? generationMediaPath(row.slug, "card") : null,
      imagePath: row.image_path,
      upvoteCount: row.upvote_count,
      downvoteCount: row.downvote_count,
      netScore: row.net_score,
      remixCount: row.remix_count,
      createdAt: row.created_at,
    })),
    hasMore,
    ideasThisWeek,
  };
}

export const fetchCachedFeedServer = unstable_cache(
  async (opts: FeedQueryOptions): Promise<FeedResponse> => {
    const supabase = createPublicSupabaseClient();
    if (!supabase) {
      return { sort: opts.sort, items: [], hasMore: false, ideasThisWeek: 0 };
    }

    try {
      return await queryFeed(supabase, opts);
    } catch {
      return { sort: opts.sort, items: [], hasMore: false, ideasThisWeek: 0 };
    }
  },
  ["feed-server"],
  { revalidate: HOMEPAGE_FEED_REVALIDATE_SECONDS },
);
