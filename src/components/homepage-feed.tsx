import { HomepageFeedDeferred } from "@/components/homepage-feed-deferred";
import type { FeedHierarchicalFilterOptions } from "@/lib/feed-profile-filter";
import type { FeedItem } from "@/lib/ui/types";

type HomepageFeedProps = {
  initialItems: FeedItem[];
  filterOptions: FeedHierarchicalFilterOptions;
};

/**
 * HomepageFeed — the feed section of the new homepage.
 * Manages filter/sort state and renders the masonry grid with infinite scroll.
 * Uses the same FeedFilterBar and FeedMasonryGrid as /feed but embedded on /.
 */
export function HomepageFeed({
  initialItems,
  filterOptions,
}: HomepageFeedProps) {
  return (
    <HomepageFeedDeferred
      initialItems={initialItems}
      filterOptions={filterOptions}
    />
  );
}
