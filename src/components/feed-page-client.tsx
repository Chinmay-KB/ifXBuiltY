"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

import { FeedFilterBar } from "@/components/feed-filter-bar";
import { FeedMasonryGrid } from "@/components/feed-masonry-grid";
import type { FeedItem, FeedSort } from "@/lib/ui/types";

type FeedPageClientProps = {
  initialItems: FeedItem[];
  initialSort: FeedSort;
  initialBuilders: string[];
  initialTargets: string[];
  initialTones: string[];
  availableBuilders: string[];
  availableTargets: string[];
};

/**
 * FeedPageClient — client wrapper that manages filter state and coordinates
 * between FeedFilterBar and FeedMasonryGrid. Also handles the empty state
 * when no results match the active filters.
 *
 * Validates: Requirements 2.1, 2.2, 2.6, 2.7
 */
export function FeedPageClient({
  initialItems,
  initialSort,
  initialBuilders,
  initialTargets,
  initialTones,
  availableBuilders,
  availableTargets,
}: FeedPageClientProps) {
  const [sort, setSort] = useState<FeedSort>(initialSort);
  const [selectedBuilders, setSelectedBuilders] =
    useState<string[]>(initialBuilders);
  const [selectedTargets, setSelectedTargets] =
    useState<string[]>(initialTargets);
  const [selectedTones, setSelectedTones] = useState<string[]>(initialTones);

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

  // Determine if filters are active (for empty state messaging)
  const hasActiveFilters =
    selectedBuilders.length > 0 ||
    selectedTargets.length > 0 ||
    selectedTones.length > 0;

  return (
    <>
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

      {/* Masonry Grid with empty state handling */}
      <div className="mt-6 flex-1 px-4 pb-10 sm:px-6 lg:px-10">
        <div className="rounded-[20px] border border-line/80 bg-linear-to-b from-panel/55 via-canvas to-panel/40 p-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.75)] sm:p-4 lg:p-5">
          {initialItems.length === 0 && hasActiveFilters ? (
            <EmptyFilterState />
          ) : (
            <FeedMasonryGrid
              initialItems={initialItems}
              sort={sort}
              builders={
                selectedBuilders.length > 0 ? selectedBuilders : undefined
              }
              targets={selectedTargets.length > 0 ? selectedTargets : undefined}
              tones={selectedTones.length > 0 ? selectedTones : undefined}
            />
          )}
        </div>
      </div>
    </>
  );
}

/** Empty state shown when no results match the active filters */
function EmptyFilterState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-xl bg-panel p-8 max-w-md">
        <p className="text-xl font-bold text-ink">
          No generations match your filters
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Try broadening your filters or create something new.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href="/feed"
            className="inline-flex items-center justify-center rounded-tile border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:bg-panel"
          >
            Clear filters
          </Link>
          <Link
            href="/generate"
            className="inline-flex items-center justify-center rounded-tile bg-ink px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-ink/90"
          >
            Generate one
          </Link>
        </div>
      </div>
    </div>
  );
}
