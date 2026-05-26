import { GenerationCard } from "@/components/generation-card";
import type { FeedItem } from "@/lib/ui/types";

type FeedMasonryGridStaticProps = {
  items: FeedItem[];
  showActions?: boolean;
};

export function FeedMasonryGridStatic({
  items,
  showActions = false,
}: FeedMasonryGridStaticProps) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-muted">
        No generations to show yet. Be the first to create one!
      </p>
    );
  }

  return (
    <div className="masonry-feed">
      {items.map((item, index) => (
        <div key={item.id} className="feed-masonry-item">
          <GenerationCard
            item={item}
            variant="paper"
            imagePriority={index < 2}
            showActions={showActions}
          />
        </div>
      ))}
    </div>
  );
}
