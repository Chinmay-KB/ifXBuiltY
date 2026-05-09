"use client";

import { useState, useCallback, useRef } from "react";

import type { FeedItem, FeedSort } from "@/lib/ui/types";

const DEFAULT_PAGE_SIZE = 20;

type UseFeedOptions = {
  sort: FeedSort;
  builders?: string[];
  targets?: string[];
  initialItems?: FeedItem[];
  pageSize?: number;
};

type UseFeedReturn = {
  items: FeedItem[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  error: string | null;
};

/**
 * useFeed — client-side infinite scroll hook for the feed.
 *
 * Fetches pages from `/api/feed` and appends results to the existing list.
 * Supports initial items from server-side fetch to avoid re-fetching the first page.
 * Resets when sort/builders/targets change.
 */
export function useFeed(options: UseFeedOptions): UseFeedReturn {
  const { sort, builders = [], targets = [], initialItems, pageSize = DEFAULT_PAGE_SIZE } = options;

  const [items, setItems] = useState<FeedItem[]>(initialItems ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track the current filter state to detect changes and reset
  const prevFiltersRef = useRef({ sort, builders: builders.join(","), targets: targets.join(",") });

  // Check if filters changed — if so, reset state
  const currentFilters = { sort, builders: builders.join(","), targets: targets.join(",") };
  if (
    prevFiltersRef.current.sort !== currentFilters.sort ||
    prevFiltersRef.current.builders !== currentFilters.builders ||
    prevFiltersRef.current.targets !== currentFilters.targets
  ) {
    prevFiltersRef.current = currentFilters;
    // Reset state synchronously during render (React supports this pattern)
    setItems([]);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
  }

  // Use a ref to prevent concurrent fetches
  const isFetchingRef = useRef(false);

  const loadMore = useCallback(() => {
    // Don't fetch if there's nothing more, already loading, or currently fetching
    if (!hasMore || isLoading || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    const offset = items.length;
    const params = new URLSearchParams();
    params.set("sort", sort);
    params.set("limit", String(pageSize));
    params.set("offset", String(offset));

    if (builders.length > 0) {
      params.set("builder", builders.join(","));
    }
    if (targets.length > 0) {
      params.set("target", targets.join(","));
    }

    fetch(`/api/feed?${params.toString()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Feed request failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((data: { items: FeedItem[]; hasMore: boolean }) => {
        setItems((prev) => [...prev, ...data.items]);
        setHasMore(data.hasMore);
      })
      .catch((err: Error) => {
        setError(err.message ?? "Failed to load feed");
      })
      .finally(() => {
        setIsLoading(false);
        isFetchingRef.current = false;
      });
  }, [hasMore, isLoading, items.length, sort, pageSize, builders, targets]);

  return { items, isLoading, hasMore, loadMore, error };
}
