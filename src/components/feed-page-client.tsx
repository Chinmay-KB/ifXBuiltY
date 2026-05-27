"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FeedFilterBarSkeleton } from "@/components/feed-filter-bar-skeleton";
import { FeedLoadingSpinner } from "@/components/feed-loading-spinner";
import { FeedMasonryGridStatic } from "@/components/feed-masonry-grid-static";
import {
  expandProfileSelectionsToNames,
  namesToProfilePicks,
  type FeedHierarchicalFilterOptions,
  type FeedProfileFilterPick,
} from "@/lib/feed-profile-filter";
import {
  buildFeedApiQuery,
  feedUrlParamsKey,
  isDefaultFeedUrlParams,
  parseFeedUrlParams,
  type FeedUrlParams,
} from "@/lib/feed-url-params";
import { useEnhanceWhenNearViewport } from "@/lib/use-enhance-when-near-viewport";
import type { FeedItem, FeedSort } from "@/lib/ui/types";

const FeedFilterBar = dynamic(
  () =>
    import("@/components/feed-filter-bar").then((mod) => mod.FeedFilterBar),
  {
    ssr: false,
    loading: () => <FeedFilterBarSkeleton />,
  },
);

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
        label="Loading feed..."
      />
    ),
  },
);

type FeedPageClientProps = {
  initialItems: FeedItem[];
  filterOptions: FeedHierarchicalFilterOptions;
};

/**
 * Static feed shell first; loads filter/infinite-scroll JS when near viewport
 * (or immediately when URL filters are active).
 */
export function FeedPageClient({
  initialItems,
  filterOptions,
}: FeedPageClientProps) {
  const searchParams = useSearchParams();
  const urlParams = useMemo(
    () => parseFeedUrlParams(searchParams),
    [searchParams],
  );
  const hasFilteredUrl = !isDefaultFeedUrlParams(urlParams);

  const { ref: sectionRef, enhanced } = useEnhanceWhenNearViewport({
    rootMargin: "320px 0px",
    immediate: hasFilteredUrl,
  });

  if (!enhanced) {
    return (
      <div ref={sectionRef} className="flex flex-1 flex-col">
        <FeedSectionChrome filterBar={<FeedFilterBarSkeleton />}>
          {hasFilteredUrl ? (
            <FeedLoadingSpinner
              className="py-16"
              label="Loading filtered feed..."
            />
          ) : (
            <FeedMasonryGridStatic items={initialItems} />
          )}
        </FeedSectionChrome>
      </div>
    );
  }

  return (
    <FeedPageInteractive
      initialItems={initialItems}
      filterOptions={filterOptions}
      urlParams={urlParams}
    />
  );
}

type FeedPageInteractiveProps = FeedPageClientProps & {
  urlParams: ReturnType<typeof parseFeedUrlParams>;
};

function FeedPageInteractive({
  initialItems,
  filterOptions,
  urlParams,
}: FeedPageInteractiveProps) {
  const router = useRouter();
  const { sort, builders, targets, tones } = urlParams;

  const selectedBuilderPicks = useMemo(
    () => namesToProfilePicks(builders, filterOptions.builderGroups),
    [builders, filterOptions.builderGroups],
  );
  const selectedTargetPicks = useMemo(
    () => namesToProfilePicks(targets, filterOptions.targetGroups),
    [targets, filterOptions.targetGroups],
  );

  const expandedBuilders = useMemo(
    () =>
      expandProfileSelectionsToNames(
        selectedBuilderPicks,
        filterOptions.builderGroups,
      ),
    [selectedBuilderPicks, filterOptions.builderGroups],
  );
  const expandedTargets = useMemo(
    () =>
      expandProfileSelectionsToNames(
        selectedTargetPicks,
        filterOptions.targetGroups,
      ),
    [selectedTargetPicks, filterOptions.targetGroups],
  );

  const feedQueryParams = useMemo(
    (): FeedUrlParams => ({
      sort,
      builders:
        selectedBuilderPicks.length > 0 ? expandedBuilders : builders,
      targets: selectedTargetPicks.length > 0 ? expandedTargets : targets,
      tones,
    }),
    [
      sort,
      builders,
      targets,
      tones,
      selectedBuilderPicks.length,
      selectedTargetPicks.length,
      expandedBuilders,
      expandedTargets,
    ],
  );

  const paramsKey = feedUrlParamsKey(feedQueryParams);
  const hasFilteredUrl = !isDefaultFeedUrlParams(feedQueryParams);

  const syncFeedUrl = useCallback(
    (next: Pick<FeedUrlParams, "sort" | "builders" | "targets" | "tones">) => {
      const params = new URLSearchParams();
      params.set("sort", next.sort);
      if (next.builders.length > 0) {
        params.set("builder", next.builders.join(","));
      }
      if (next.targets.length > 0) {
        params.set("target", next.targets.join(","));
      }
      if (next.tones.length > 0) {
        params.set("tone", next.tones.join(","));
      }
      router.push(`/feed?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const [items, setItems] = useState<FeedItem[]>(
    hasFilteredUrl ? [] : initialItems,
  );
  const [isSyncing, setIsSyncing] = useState(hasFilteredUrl);
  const [enableInfiniteScroll, setEnableInfiniteScroll] = useState(
    hasFilteredUrl,
  );
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const useInteractiveGrid = hasFilteredUrl || enableInfiniteScroll;

  useEffect(() => {
    if (!hasFilteredUrl) {
      setItems(initialItems);
      setIsSyncing(false);
      return;
    }

    let cancelled = false;
    setIsSyncing(true);

    void fetch(`/api/feed?${buildFeedApiQuery(feedQueryParams)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Feed request failed");
        return res.json() as Promise<{ items: FeedItem[] }>;
      })
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paramsKey, initialItems, hasFilteredUrl, feedQueryParams]);

  useEffect(() => {
    if (useInteractiveGrid) return;

    const node = loadMoreSentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setEnableInfiniteScroll(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setEnableInfiniteScroll(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px 400px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [useInteractiveGrid]);

  const handleSortChange = useCallback(
    (newSort: FeedSort) => {
      syncFeedUrl({
        sort: newSort,
        builders: expandedBuilders,
        targets: expandedTargets,
        tones,
      });
    },
    [syncFeedUrl, expandedBuilders, expandedTargets, tones],
  );

  const handleBuilderPicksChange = useCallback(
    (picks: FeedProfileFilterPick[]) => {
      syncFeedUrl({
        sort,
        builders: expandProfileSelectionsToNames(
          picks,
          filterOptions.builderGroups,
        ),
        targets: expandedTargets,
        tones,
      });
    },
    [syncFeedUrl, sort, filterOptions.builderGroups, expandedTargets, tones],
  );

  const handleTargetPicksChange = useCallback(
    (picks: FeedProfileFilterPick[]) => {
      syncFeedUrl({
        sort,
        builders: expandedBuilders,
        targets: expandProfileSelectionsToNames(
          picks,
          filterOptions.targetGroups,
        ),
        tones,
      });
    },
    [syncFeedUrl, sort, expandedBuilders, filterOptions.targetGroups, tones],
  );

  const handleTonesChange = useCallback(
    (newTones: string[]) => {
      syncFeedUrl({
        sort,
        builders: expandedBuilders,
        targets: expandedTargets,
        tones: newTones,
      });
    },
    [syncFeedUrl, sort, expandedBuilders, expandedTargets],
  );

  const hasActiveFilters = !isDefaultFeedUrlParams(feedQueryParams);

  return (
    <>
      <FeedSectionChrome
        filterBar={
          <FeedFilterBar
            variant="paper"
            syncUrl={false}
            currentSort={sort}
            builderGroups={filterOptions.builderGroups}
            targetGroups={filterOptions.targetGroups}
            selectedBuilderPicks={selectedBuilderPicks}
            selectedTargetPicks={selectedTargetPicks}
            selectedTones={tones}
            onSortChange={handleSortChange}
            onBuilderPicksChange={handleBuilderPicksChange}
            onTargetPicksChange={handleTargetPicksChange}
            onTonesChange={handleTonesChange}
          />
        }
      >
        {isSyncing ? (
          <FeedLoadingSpinner
            className="py-16"
            label="Loading filtered feed..."
          />
        ) : items.length === 0 && hasActiveFilters ? (
          <EmptyFilterState />
        ) : useInteractiveGrid ? (
          <DynamicFeedMasonryGrid
            key={feedUrlParamsKey(feedQueryParams)}
            initialItems={items}
            sort={sort}
            builders={
              feedQueryParams.builders.length > 0
                ? feedQueryParams.builders
                : undefined
            }
            targets={
              feedQueryParams.targets.length > 0
                ? feedQueryParams.targets
                : undefined
            }
            tones={tones.length > 0 ? tones : undefined}
          />
        ) : (
          <>
            <FeedMasonryGridStatic items={items} />
            <div ref={loadMoreSentinelRef} aria-hidden className="h-px w-full" />
          </>
        )}
      </FeedSectionChrome>
    </>
  );
}

function FeedSectionChrome({
  filterBar,
  children,
}: {
  filterBar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-sm md:top-20">
        {filterBar}
      </div>
      <div className="mt-6 flex-1 px-4 pb-10 sm:px-6 lg:px-10">
        <div className="rounded-[20px] border border-line/80 bg-linear-to-b from-panel/55 via-canvas to-panel/40 p-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.75)] sm:p-4 lg:p-5">
          {children}
        </div>
      </div>
    </>
  );
}

function EmptyFilterState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="max-w-md rounded-xl bg-panel p-8">
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
