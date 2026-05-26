"use client";

import dynamic from "next/dynamic";

import { FeedMasonryGridStatic } from "@/components/feed-masonry-grid-static";
import type { FeedHierarchicalFilterOptions } from "@/lib/feed-profile-filter";
import { useEnhanceWhenNearViewport } from "@/lib/use-enhance-when-near-viewport";
import type { FeedItem } from "@/lib/ui/types";

const HomepageFeedClient = dynamic(
  () =>
    import("@/components/homepage-feed-client").then(
      (mod) => mod.HomepageFeedClient,
    ),
  { ssr: false },
);

type HomepageFeedDeferredProps = {
  initialItems: FeedItem[];
  filterOptions: FeedHierarchicalFilterOptions;
};

/**
 * Renders the static feed grid immediately, then loads filter/interaction JS
 * when the feed section is near the viewport.
 */
export function HomepageFeedDeferred({
  initialItems,
  filterOptions,
}: HomepageFeedDeferredProps) {
  const { ref: sectionRef, enhanced } = useEnhanceWhenNearViewport({
    rootMargin: "240px 0px",
  });

  return (
    <div
      id="feed"
      ref={sectionRef}
      className="relative flex min-h-[320px] flex-1 flex-col"
    >
      {enhanced ? (
        <HomepageFeedClient filterOptions={filterOptions}>
          <FeedMasonryGridStatic items={initialItems} />
        </HomepageFeedClient>
      ) : (
        <div className="flex flex-1 flex-col px-4 pt-6 pb-10 md:px-10 md:pt-7">
          <FeedMasonryGridStatic items={initialItems} />
        </div>
      )}
    </div>
  );
}
