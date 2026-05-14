"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";

import { FeedFilterBar } from "@/components/feed-filter-bar";
import type { FeedSort } from "@/lib/ui/types";

const DynamicFeedMasonryGrid = dynamic(
  () =>
    import("@/components/feed-masonry-grid").then(
      (module) => module.FeedMasonryGrid,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-ink" />
        <span className="sr-only">Loading filtered feed...</span>
      </div>
    ),
  },
);

type HomepageFeedClientProps = {
  availableBuilders: string[];
  availableTargets: string[];
  children: ReactNode;
};

export function HomepageFeedClient({
  availableBuilders,
  availableTargets,
  children,
}: HomepageFeedClientProps) {
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

  const isInitialView =
    sort === "trending" &&
    selectedBuilders.length === 0 &&
    selectedTargets.length === 0 &&
    selectedTones.length === 0;

  return (
    <>
      <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-sm md:top-20">
        <FeedFilterBar
          variant="paper"
          syncUrl={false}
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

      <div className="flex-1 px-4 pt-6 pb-10 md:px-10 md:pt-7">
        {isInitialView ? (
          children
        ) : (
          <DynamicFeedMasonryGrid
            key={`${sort}|${selectedBuilders.join(",")}|${selectedTargets.join(",")}|${selectedTones.join(",")}`}
            initialItems={[]}
            sort={sort}
            builders={selectedBuilders.length > 0 ? selectedBuilders : undefined}
            targets={selectedTargets.length > 0 ? selectedTargets : undefined}
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
