"use client";

import { useCallback, useMemo, useState } from "react";

import {
  expandProfileSelectionsToNames,
  type FeedHierarchicalFilterOptions,
  type FeedProfileFilterPick,
} from "@/lib/feed-profile-filter";
import type { FeedSort } from "@/lib/feed-types";

/**
 * Local filter state for embedded feeds (homepage) that do not sync to the URL.
 */
export function useHierarchicalFeedFilters(
  filterOptions: FeedHierarchicalFilterOptions,
) {
  const [sort, setSort] = useState<FeedSort>("newest");
  const [selectedBuilderPicks, setSelectedBuilderPicks] = useState<
    FeedProfileFilterPick[]
  >([]);
  const [selectedTargetPicks, setSelectedTargetPicks] = useState<
    FeedProfileFilterPick[]
  >([]);
  const [selectedTones, setSelectedTones] = useState<string[]>([]);

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

  const isInitialView =
    sort === "newest" &&
    selectedBuilderPicks.length === 0 &&
    selectedTargetPicks.length === 0 &&
    selectedTones.length === 0;

  const handleSortChange = useCallback((newSort: FeedSort) => {
    setSort(newSort);
  }, []);

  const handleBuilderPicksChange = useCallback((picks: FeedProfileFilterPick[]) => {
    setSelectedBuilderPicks(picks);
  }, []);

  const handleTargetPicksChange = useCallback((picks: FeedProfileFilterPick[]) => {
    setSelectedTargetPicks(picks);
  }, []);

  const handleTonesChange = useCallback((next: string[]) => {
    setSelectedTones(next);
  }, []);

  return {
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
  };
}
