"use client";

import { useEffect, useRef, useCallback } from "react";

import { GenerationCard } from "@/components/generation-card";
import { useFeed } from "@/hooks/use-feed";
import type { FeedItem } from "@/lib/ui/types";

type HomeFeedGridProps = {
  initialItems: FeedItem[];
};

/**
 * HomeFeedGrid — homepage-specific masonry feed grid.
 *
 * - Uses `useFeed` with `sort: "trending"` as default
 * - Masonry layout via CSS columns (`.masonry-feed` class from globals.css)
 * - Designed to show ≥12 cards above the fold on desktop (1280px+) with 5 columns
 * - Infinite scroll via IntersectionObserver sentinel
 * - Accepts `initialItems` from server-side fetch to avoid waterfall
 *
 * Validates: Requirements 1.2, 1.5, 1.6
 */
export function HomeFeedGrid({ initialItems }: HomeFeedGridProps) {
  const { items, isLoading, hasMore, loadMore } = useFeed({
    sort: "trending",
    initialItems,
  });

  // IntersectionObserver sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry?.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    [hasMore, isLoading, loadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: "300px",
    });
    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleIntersect]);

  if (items.length === 0 && !isLoading) {
    return (
      <div className="max-w-md rounded-lg bg-panel p-5">
        <p className="text-xl font-black text-ink">Nothing here yet</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No generations to show. Be the first to cook something up.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Masonry grid — uses .masonry-feed from globals.css for responsive columns */}
      <div className="masonry-feed gap-4">
        {items.map((item) => (
          <div key={item.id} className="mb-4 break-inside-avoid">
            <GenerationCard item={item} />
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
        </div>
      )}

      {/* Infinite scroll sentinel — triggers loadMore when visible */}
      {hasMore && <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />}
    </div>
  );
}
