import type { Metadata } from "next";

import { HomepageHero } from "@/components/homepage-hero";
import { HomepageFeed } from "@/components/homepage-feed";
import { getFeedFilterOptions } from "@/lib/feed-filter-options";
import { fetchFeedServer } from "@/lib/fetch-feed";
import { getHomepageFeaturedGenerations } from "@/lib/homepage-featured-generations";
import { getTotalPublishedCount } from "@/lib/homepage-stats";

export const metadata: Metadata = {
  title: {
    absolute:
      "ifXBuiltY - Cursed AI screenshots from brand mashups",
  },
  description:
    "The internet's tiny lab for cursed product ideas. Crossbreed any company with any app, get an AI screenshot, then vote, remix, and share the evidence.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  // Fetch featured generations for hero thumbnails + initial feed items in parallel
  const [featuredGenerations, feed, totalPublished, filterOptions] = await Promise.all([
    getHomepageFeaturedGenerations(),
    fetchFeedServer({ sort: "trending", limit: 24 }),
    getTotalPublishedCount(),
    getFeedFilterOptions(),
  ]);

  // Build hero thumbnails — use featured first, supplement with feed items if needed
  const featuredThumbs = featuredGenerations.map((g) => ({
    id: g.id,
    slug: g.slug,
    builder: g.builder,
    target: g.target,
    imageUrl: g.imageUrl,
  }));

  // Fill remaining slots from feed items not already in featured
  const featuredIds = new Set(featuredThumbs.map((t) => t.id));
  const supplementThumbs = feed.items
    .filter((item) => !featuredIds.has(item.id) && item.imageUrl)
    .slice(0, 15 - featuredThumbs.length)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      builder: item.builder,
      target: item.target,
      imageUrl: item.imageUrl!,
    }));

  const heroThumbnails = [...featuredThumbs, ...supplementThumbs];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-canvas">
      <HomepageHero
        thumbnails={heroThumbnails}
        ideasThisWeek={feed.ideasThisWeek ?? 0}
        totalPublished={totalPublished}
      />
      <HomepageFeed
        initialItems={feed.items}
        availableBuilders={filterOptions.builders}
        availableTargets={filterOptions.targets}
      />
    </div>
  );
}
