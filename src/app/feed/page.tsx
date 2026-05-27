import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FeedPageClient } from "@/components/feed-page-client";
import { FeedLoadingSpinner } from "@/components/feed-loading-spinner";
import { FeedPaperHero } from "@/components/feed-paper-hero";
import { getFeedHierarchicalFilterOptions } from "@/lib/feed-filter-options";
import { fetchFeedServer } from "@/lib/fetch-feed";

export const metadata: Metadata = {
  title: "Browse cursed AI screenshots",
  description:
    "A public evidence locker of cursed AI UI screenshots. Filter brand mashups, vote on the cursed ones, and pretend product strategy did this on purpose.",
  alternates: { canonical: "/feed" },
};

/** Cached default feed shell; filter query params are applied on the client. */
export const revalidate = 120;

export default async function FeedPage() {
  const [feed, filterOptions] = await Promise.all([
    fetchFeedServer({ sort: "newest", limit: 24 }),
    getFeedHierarchicalFilterOptions(),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-canvas">
      <FeedPaperHero ideasThisWeek={feed.ideasThisWeek ?? 0} />

      <div className="flex flex-1 flex-col pb-10 pt-0">
        {feed.items.length === 0 ? (
          <div className="px-6 lg:px-10">
            <EmptyFeedState />
          </div>
        ) : (
          <Suspense
            fallback={
              <FeedLoadingSpinner className="mt-6 flex-1 px-4 pb-10" />
            }
          >
            <FeedPageClient
              initialItems={feed.items}
              filterOptions={filterOptions}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

/** Empty state when the feed has no published generations at all */
function EmptyFeedState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-xl bg-panel p-8 max-w-md">
        <p className="text-xl font-bold text-ink">No crimes yet</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This corner is suspiciously well-behaved. Cook the first one.
        </p>
        <Link
          href="/generate"
          className="mt-4 inline-flex items-center justify-center rounded-tile bg-ink px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-ink/90"
        >
          Generate one
        </Link>
      </div>
    </div>
  );
}
