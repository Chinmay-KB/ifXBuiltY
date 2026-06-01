"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { FeedSectionChrome } from "@/components/feed/feed-section-chrome";
import {
  LazyFeedFilterBar,
  LazyFeedMasonryGrid,
} from "@/components/feed/feed-lazy-modules";
import { useHierarchicalFeedFilters } from "@/hooks/use-hierarchical-feed-filters";
import type { FeedHierarchicalFilterOptions } from "@/lib/feed-profile-filter";

type HomepageFeedClientProps = {
  filterOptions: FeedHierarchicalFilterOptions;
  children: ReactNode;
};

export function HomepageFeedClient({
  filterOptions,
  children,
}: HomepageFeedClientProps) {
  const {
    sort,
    selectedBuilderPicks,
    selectedTargetPicks,
    selectedTones,
    expandedBuilders,
    expandedTargets,
    isInitialView,
    handleSortChange,
    handleBuilderPicksChange,
    handleTargetPicksChange,
    handleTonesChange,
  } = useHierarchicalFeedFilters(filterOptions);

  return (
    <>
      <FeedSectionChrome
        stickyClassName="sticky top-0 z-30 bg-canvas/95 backdrop-blur-sm md:top-20"
        contentClassName="flex-1 px-4 pt-6 pb-10 md:px-10 md:pt-7"
        filterBar={
          <LazyFeedFilterBar
            variant="paper"
            currentSort={sort}
            builderGroups={filterOptions.builderGroups}
            targetGroups={filterOptions.targetGroups}
            selectedBuilderPicks={selectedBuilderPicks}
            selectedTargetPicks={selectedTargetPicks}
            onSortChange={handleSortChange}
            onBuilderPicksChange={handleBuilderPicksChange}
            onTargetPicksChange={handleTargetPicksChange}
          />
        }
      >
        {isInitialView ? (
          children
        ) : (
          <LazyFeedMasonryGrid
            key={`${sort}|${expandedBuilders.join(",")}|${expandedTargets.join(",")}|${selectedTones.join(",")}`}
            initialItems={[]}
            sort={sort}
            builders={expandedBuilders.length > 0 ? expandedBuilders : undefined}
            targets={expandedTargets.length > 0 ? expandedTargets : undefined}
            tones={selectedTones.length > 0 ? selectedTones : undefined}
          />
        )}
      </FeedSectionChrome>

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
    </>
  );
}
