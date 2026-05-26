import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { applyPublicFeedFilters } from "@/lib/feed-public-filters";
import { generationMediaPath } from "@/lib/generation-media-url";
import { tryGetSupabasePublicEnv } from "@/lib/supabase/public-env";

const HOMEPAGE_FEATURED_LIMIT = 8;
const HOMEPAGE_FEATURED_REVALIDATE_SECONDS = 60 * 60;

export type HomepageFeaturedGeneration = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  imageUrl: string;
  netScore: number;
  remixCount: number;
};

type FeaturedGenerationRow = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  image_path: string | null;
  net_score: number;
  remix_count: number;
};

async function fetchHomepageFeaturedGenerations(): Promise<
  HomepageFeaturedGeneration[]
> {
  const env = tryGetSupabasePublicEnv();
  if (!env) return [];

  const supabase = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await applyPublicFeedFilters(
    supabase
      .from("generations")
      .select("id, slug, builder, target, image_path, net_score, remix_count"),
  )
    .order("net_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(HOMEPAGE_FEATURED_LIMIT)
    .returns<FeaturedGenerationRow[]>();

  if (error || !data) return [];

  return data
    .filter((row) => row.image_path?.trim())
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      builder: row.builder,
      target: row.target,
      imageUrl: generationMediaPath(row.slug, "card"),
      netScore: row.net_score,
      remixCount: row.remix_count,
    }));
}

export const getHomepageFeaturedGenerations = unstable_cache(
  fetchHomepageFeaturedGenerations,
  ["homepage-featured-generations"],
  { revalidate: HOMEPAGE_FEATURED_REVALIDATE_SECONDS },
);
