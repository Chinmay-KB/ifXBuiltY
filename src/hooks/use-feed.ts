"use client";

import { useState, useCallback, useRef, useEffect } from "react";

import type { FeedItem, FeedSort } from "@/lib/ui/types";

const DEFAULT_PAGE_SIZE = 20;

type UseFeedOptions = {
  sort: FeedSort;
  builders?: string[];
  targets?: string[];
  tones?: string[];
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
  const { sort, builders = [], targets = [], tones = [], initialItems, pageSize = DEFAULT_PAGE_SIZE } = options;

  const [items, setItems] = useState<FeedItem[]>(initialItems ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = `${sort}|${builders.join(",")}|${targets.join(",")}|${tones.join(",")}`;
  const prevFilterKeyRef = useRef(filterKey);

  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return;
    prevFilterKeyRef.current = filterKey;
    setItems([]);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
  }, [filterKey]);

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
    if (tones.length > 0) {
      params.set("tone", tones.join(","));
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
  }, [hasMore, isLoading, items.length, sort, pageSize, builders, targets, tones]);

  return { items, isLoading, hasMore, loadMore, error };
}
