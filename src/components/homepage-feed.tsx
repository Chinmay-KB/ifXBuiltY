"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

import { FeedFilterBar } from "@/components/feed-filter-bar";
import { FeedMasonryGrid } from "@/components/feed-masonry-grid";
import type { FeedItem, FeedSort } from "@/lib/ui/types";

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
  const [sort, setSort] = useState<FeedSort>("trending");
  const [selectedBuilders, setSelectedBuilders] = useState<string[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [selectedTones, setSelectedTones] = useState<string[]>([]);

  const handleSortChange = useCallback((newSort: FeedSort) => {
    setSort(newSort);
  }, []);

  const handleBuildersChange = useCallback((newBuilders: string[]) => {
    setSelectedBuilders(newBuilders);
  }, []);

  const handleTargetsChange = useCallback((newTargets: string[]) => {
    setSelectedTargets(newTargets);
  }, []);

  const handleTonesChange = useCallback((next: string[]) => {
    setSelectedTones(next);
  }, []);

  return (
    <div id="feed" className="relative flex flex-1 flex-col">
      {/* Filter bar — sticky on scroll */}
      <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-sm md:top-20">
        <FeedFilterBar
          variant="paper"
          currentSort={sort}
          builders={availableBuilders}
          targets={availableTargets}
          selectedBuilders={selectedBuilders}
          selectedTargets={selectedTargets}
          selectedTones={selectedTones}
          onSortChange={handleSortChange}
          onBuildersChange={handleBuildersChange}
          onTargetsChange={handleTargetsChange}
          onTonesChange={handleTonesChange}
        />
      </div>

      {/* Masonry Grid */}
      <div className="flex-1 px-4 pt-6 pb-10 md:px-10 md:pt-7">
        <FeedMasonryGrid
          initialItems={initialItems}
          sort={sort}
          builders={selectedBuilders.length > 0 ? selectedBuilders : undefined}
          targets={selectedTargets.length > 0 ? selectedTargets : undefined}
          tones={selectedTones.length > 0 ? selectedTones : undefined}
        />
      </div>

      {/* Mobile FAB — generate button */}
      <Link
        href="/generate"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-chrome text-ink shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-ink/10 transition-transform hover:scale-105 active:scale-95 md:hidden"
        aria-label="Start generating"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </div>
  );
}
