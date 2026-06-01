"use client";

import dynamic from "next/dynamic";

import { FeedFilterBarSkeleton } from "@/components/feed-filter-bar-skeleton";
import { FeedLoadingSpinner } from "@/components/feed-loading-spinner";

export const LazyFeedFilterBar = dynamic(
  () =>
    import("@/components/feed-filter-bar").then((mod) => mod.FeedFilterBar),
  {
    ssr: false,
    loading: () => <FeedFilterBarSkeleton />,
  },
);

export const LazyFeedMasonryGrid = dynamic(
  () =>
    import("@/components/feed-masonry-grid").then(
      (module) => module.FeedMasonryGrid,
    ),
  {
    ssr: false,
    loading: () => (
      <FeedLoadingSpinner className="py-8" label="Loading feed..." />
    ),
  },
);
