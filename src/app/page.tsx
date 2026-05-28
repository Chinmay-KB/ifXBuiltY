import type { Metadata } from "next";
import { Suspense } from "react";

import { HomepageHero } from "@/components/homepage-hero";
import { HomepageFeed } from "@/components/homepage-feed";
import { getFeedHierarchicalFilterOptions } from "@/lib/feed-filter-options";
import { fetchFeedServer } from "@/lib/fetch-feed";
import { getHomepageFeaturedGenerations } from "@/lib/homepage-featured-generations";
import { getTotalPublishedCount } from "@/lib/homepage-stats";

export const metadata: Metadata = {
  title: {
    absolute:
      "ifXBuiltY - Cursed AI screenshots from brand mashups",
  },
  description:
    "The internet's tiny lab for cursed product ideas. Crossbreed any company with any app, get an AI screenshot, then vote and share the evidence.",
  alternates: { canonical: "/" },
};

/** Align with cached feed queries used on the homepage. */
export const revalidate = 120;

const HERO_THUMBNAIL_LIMIT = 8;

async function HomepageFeedSection() {
  const [feed, filterOptions] = await Promise.all([
    fetchFeedServer({ sort: "newest", limit: 24 }),
    getFeedHierarchicalFilterOptions(),
  ]);

  return <HomepageFeed initialItems={feed.items} filterOptions={filterOptions} />;
}

export default async function HomePage() {
  // Keep the above-the-fold hero unblocked by heavier feed/filter work.
  const [featuredGenerations, heroFeed, totalPublished] = await Promise.all([
    getHomepageFeaturedGenerations(),
    fetchFeedServer({ sort: "newest", limit: 12 }),
    getTotalPublishedCount(),
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
  const supplementThumbs = heroFeed.items
    .filter((item) => !featuredIds.has(item.id) && item.imageUrl)
    .slice(0, HERO_THUMBNAIL_LIMIT - featuredThumbs.length)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      builder: item.builder,
      target: item.target,
      imageUrl: item.imageUrl!,
    }));

  const heroThumbnails = [...featuredThumbs, ...supplementThumbs].slice(
    0,
    HERO_THUMBNAIL_LIMIT,
  );

  return (
    <div className="flex min-h-full flex-1 flex-col bg-canvas">
      <HomepageHero
        thumbnails={heroThumbnails}
        ideasThisWeek={heroFeed.ideasThisWeek ?? 0}
        totalPublished={totalPublished}
      />
      <Suspense
        fallback={
          <div className="px-4 py-10 sm:px-8 md:px-10 lg:px-16">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Loading the evidence locker…
            </p>
          </div>
        }
      >
        <HomepageFeedSection />
      </Suspense>
    </div>
  );
}
