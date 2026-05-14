import { FeedMasonryGridStatic } from "@/components/feed-masonry-grid-static";
import { HomepageFeedClient } from "@/components/homepage-feed-client";
import type { FeedItem } from "@/lib/ui/types";

type HomepageFeedProps = {
  initialItems: FeedItem[];
  availableBuilders: string[];
  availableTargets: string[];
};

/**
 * HomepageFeed — the feed section of the new homepage.
 * Manages filter/sort state and renders the masonry grid with infinite scroll.
 * Uses the same FeedFilterBar and FeedMasonryGrid as /feed but embedded on /.
 */
export function HomepageFeed({
  initialItems,
  availableBuilders,
  availableTargets,
}: HomepageFeedProps) {
  return (
    <div id="feed" className="relative flex flex-1 flex-col">
      <HomepageFeedClient
        availableBuilders={availableBuilders}
        availableTargets={availableTargets}
      >
        <FeedMasonryGridStatic items={initialItems} />
      </HomepageFeedClient>
    </div>
  );
}
