"use client";

import { useEffect, useRef, useCallback } from "react";

import { GenerationCard } from "@/components/generation-card";
import { useFeed } from "@/hooks/use-feed";
import type { FeedItem, FeedSort } from "@/lib/ui/types";

type FeedMasonryGridProps = {
  initialItems: FeedItem[];
  sort: FeedSort;
  builders?: string[];
  targets?: string[];
  tones?: string[];
};

/**
 * FeedMasonryGrid — responsive masonry layout for the feed page.
 *
 * Uses CSS columns via the `.masonry-feed` class (defined in globals.css):
 *   - 1 column  (<640px)
 *   - 2 columns (640–1023px)
 *   - 3 columns (1024–1279px)
 *   - 5 columns (≥1280px)
 *
 * Cards use `break-inside-avoid` to prevent splitting across columns.
 * Includes an InfiniteScrollSentinel (IntersectionObserver at 300px threshold)
 * to trigger `loadMore()` as the user approaches the bottom.
 *
 * Validates: Requirements 2.7, 2.8, 2.9, 2.10, 10.1, 10.3
 */
export function FeedMasonryGrid({
  initialItems,
  sort,
  builders,
  targets,
  tones,
}: FeedMasonryGridProps) {
  const { items, isLoading, hasMore, loadMore, error } = useFeed({
    sort,
    builders,
    targets,
    tones,
    initialItems,
  });

  return (
    <div>
      {/* Masonry grid */}
      <div className="masonry-feed gap-4">
        {items.map((item) => (
          <div key={item.id} className="mb-4 break-inside-avoid">
            <GenerationCard item={item} variant="paper" />
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <p className="mt-4 text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-ink" />
          <span className="sr-only">Loading more items…</span>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && !isLoading && (
        <InfiniteScrollSentinel onIntersect={loadMore} />
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && !error && (
        <p className="py-12 text-center text-muted">
          No generations to show yet. Be the first to create one!
        </p>
      )}
    </div>
  );
}

/* ─── InfiniteScrollSentinel ─── */

type InfiniteScrollSentinelProps = {
  onIntersect: () => void;
};

/**
 * InfiniteScrollSentinel — triggers a callback when the user scrolls
 * within 300px of this element using IntersectionObserver.
 */
function InfiniteScrollSentinel({ onIntersect }: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onIntersectRef = useRef(onIntersect);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) {
        onIntersectRef.current();
      }
    },
    []
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "0px 0px 300px 0px",
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersect]);

  return <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />;
}
