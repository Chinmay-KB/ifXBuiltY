import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { tryGetSupabasePublicEnv } from "@/lib/supabase/public-env";

type FeedFilterOptions = {
  builders: string[];
  targets: string[];
};

type GenerationFilterRow = {
  builder: string | null;
  target: string | null;
};

const MAX_OPTION_ROWS = 5000;
const FILTER_OPTIONS_REVALIDATE_SECONDS = 60 * 60;

function addTrimmed(set: Set<string>, value: string | null | undefined) {
  const trimmed = value?.trim();
  if (trimmed) set.add(trimmed);
}

function sortOptions(options: Iterable<string>): string[] {
  return Array.from(options).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

/**
 * Fetch filter dropdown options from the full published feed, not just the
 * currently-rendered page of cards.
 */
async function fetchFeedFilterOptions(): Promise<FeedFilterOptions> {
  const env = tryGetSupabasePublicEnv();
  if (!env) return { builders: [], targets: [] };

  const supabase = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from("generations")
    .select("builder, target")
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .range(0, MAX_OPTION_ROWS - 1);

  if (error) {
    console.error("Could not load feed filter options", error);
    return { builders: [], targets: [] };
  }

  const builders = new Set<string>();
  const targets = new Set<string>();

  for (const row of (data ?? []) as GenerationFilterRow[]) {
    addTrimmed(builders, row.builder);
    addTrimmed(targets, row.target);
  }

  return {
    builders: sortOptions(builders),
    targets: sortOptions(targets),
  };
}

export const getFeedFilterOptions = unstable_cache(
  fetchFeedFilterOptions,
  ["feed-filter-options"],
  { revalidate: FILTER_OPTIONS_REVALIDATE_SECONDS },
);
