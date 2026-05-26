"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";

import { FeedFilterBarSkeleton } from "@/components/feed-filter-bar-skeleton";
import { FeedLoadingSpinner } from "@/components/feed-loading-spinner";

const FeedFilterBar = dynamic(
  () =>
    import("@/components/feed-filter-bar").then((mod) => mod.FeedFilterBar),
  {
    ssr: false,
    loading: () => <FeedFilterBarSkeleton />,
  },
);
import {
  expandProfileSelectionsToNames,
  type FeedHierarchicalFilterOptions,
  type FeedProfileFilterPick,
} from "@/lib/feed-profile-filter";
import type { FeedSort } from "@/lib/ui/types";

const DynamicFeedMasonryGrid = dynamic(
  () =>
    import("@/components/feed-masonry-grid").then(
      (module) => module.FeedMasonryGrid,
    ),
  {
    ssr: false,
    loading: () => (
      <FeedLoadingSpinner
        className="py-8"
        label="Loading filtered feed..."
      />
    ),
  },
);

type HomepageFeedClientProps = {
  filterOptions: FeedHierarchicalFilterOptions;
  children: ReactNode;
};

export function HomepageFeedClient({
  filterOptions,
  children,
}: HomepageFeedClientProps) {
  const [sort, setSort] = useState<FeedSort>("newest");
  const [selectedBuilderPicks, setSelectedBuilderPicks] = useState<
    FeedProfileFilterPick[]
  >([]);
  const [selectedTargetPicks, setSelectedTargetPicks] = useState<
    FeedProfileFilterPick[]
  >([]);
  const [selectedTones, setSelectedTones] = useState<string[]>([]);

  const expandedBuilders = expandProfileSelectionsToNames(
    selectedBuilderPicks,
    filterOptions.builderGroups,
  );
  const expandedTargets = expandProfileSelectionsToNames(
    selectedTargetPicks,
    filterOptions.targetGroups,
  );

  const handleSortChange = useCallback((newSort: FeedSort) => {
    setSort(newSort);
  }, []);

  const handleBuilderPicksChange = useCallback(
    (picks: FeedProfileFilterPick[]) => {
      setSelectedBuilderPicks(picks);
    },
    [],
  );

  const handleTargetPicksChange = useCallback((picks: FeedProfileFilterPick[]) => {
    setSelectedTargetPicks(picks);
  }, []);

  const handleTonesChange = useCallback((next: string[]) => {
    setSelectedTones(next);
  }, []);

  const isInitialView =
    sort === "newest" &&
    selectedBuilderPicks.length === 0 &&
    selectedTargetPicks.length === 0 &&
    selectedTones.length === 0;

  return (
    <>
      <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-sm md:top-20">
        <FeedFilterBar
          variant="paper"
          syncUrl={false}
          currentSort={sort}
          builderGroups={filterOptions.builderGroups}
          targetGroups={filterOptions.targetGroups}
          selectedBuilderPicks={selectedBuilderPicks}
          selectedTargetPicks={selectedTargetPicks}
          selectedTones={selectedTones}
          onSortChange={handleSortChange}
          onBuilderPicksChange={handleBuilderPicksChange}
          onTargetPicksChange={handleTargetPicksChange}
          onTonesChange={handleTonesChange}
        />
      </div>

      <div className="flex-1 px-4 pt-6 pb-10 md:px-10 md:pt-7">
        {isInitialView ? (
          children
        ) : (
          <DynamicFeedMasonryGrid
            key={`${sort}|${expandedBuilders.join(",")}|${expandedTargets.join(",")}|${selectedTones.join(",")}`}
            initialItems={[]}
            sort={sort}
            builders={expandedBuilders.length > 0 ? expandedBuilders : undefined}
            targets={expandedTargets.length > 0 ? expandedTargets : undefined}
            tones={selectedTones.length > 0 ? selectedTones : undefined}
          />
        )}
      </div>

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
