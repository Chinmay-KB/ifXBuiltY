import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import {
  publicGenerationsQuery,
  type GenerationsSelectClient,
} from "@/lib/feed-public-filters";
import { tryGetSupabasePublicEnv } from "@/lib/supabase/public-env";

const REVALIDATE_SECONDS = 60 * 60; // 1 hour

/**
 * Count total published + visible generations.
 * Used as the "designers cooking" social proof number on the homepage.
 * Only shown when ≥ 100.
 */
async function fetchTotalPublishedCount(): Promise<number> {
  const env = tryGetSupabasePublicEnv();
  if (!env) return 0;

  const supabase = createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as GenerationsSelectClient;

  const { count, error } = await publicGenerationsQuery(supabase, "*", {
    count: "exact",
    head: true,
  });

  if (error || count == null) return 0;
  return count;
}

export const getTotalPublishedCount = unstable_cache(
  fetchTotalPublishedCount,
  ["homepage-total-published"],
  { revalidate: REVALIDATE_SECONDS },
);
