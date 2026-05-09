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
  availableBuilders,
  availableTargets,
}: FeedPageClientProps) {
  const [sort, setSort] = useState<FeedSort>(initialSort);
  const [selectedBuilders, setSelectedBuilders] =
    useState<string[]>(initialBuilders);
  const [selectedTargets, setSelectedTargets] =
    useState<string[]>(initialTargets);

  const handleSortChange = useCallback((newSort: FeedSort) => {
    setSort(newSort);
  }, []);

  const handleBuildersChange = useCallback((newBuilders: string[]) => {
    setSelectedBuilders(newBuilders);
  }, []);

  const handleTargetsChange = useCallback((newTargets: string[]) => {
    setSelectedTargets(newTargets);
  }, []);

  // Determine if filters are active (for empty state messaging)
  const hasActiveFilters =
    selectedBuilders.length > 0 || selectedTargets.length > 0;

  return (
    <>
      {/* Filter Bar */}
      <FeedFilterBar
        currentSort={sort}
        builders={availableBuilders}
        targets={availableTargets}
        selectedBuilders={selectedBuilders}
        selectedTargets={selectedTargets}
        onSortChange={handleSortChange}
        onBuildersChange={handleBuildersChange}
        onTargetsChange={handleTargetsChange}
      />

      {/* Masonry Grid with empty state handling */}
      <div className="mt-6 flex-1">
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
          />
        )}
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
            className="inline-flex items-center justify-center rounded-[7px] border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:bg-panel"
          >
            Clear filters
          </Link>
          <Link
            href="/generate"
            className="inline-flex items-center justify-center rounded-[7px] bg-ink px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-ink/90"
          >
            Generate one
          </Link>
        </div>
      </div>
    </div>
  );
}
