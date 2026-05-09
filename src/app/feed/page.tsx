import Link from "next/link";

import { FeedPageClient } from "@/components/feed-page-client";
import { fetchFeedServer } from "@/lib/fetch-feed";
import type { FeedSort } from "@/lib/feed-types";

type Props = {
  searchParams: Promise<{ sort?: string; builder?: string; target?: string }>;
};

function parseSort(raw: string | undefined): FeedSort {
  if (raw === "trending") return "trending";
  if (raw === "top") return "top";
  return "newest";
}

function parseCommaSeparated(raw: string | undefined): string[] {
  if (!raw || raw.trim() === "") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default async function FeedPage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const builders = parseCommaSeparated(params.builder);
  const targets = parseCommaSeparated(params.target);

  // Server-fetch initial feed items with the parsed params
  const feed = await fetchFeedServer({
    sort,
    limit: 24,
    builders: builders.length > 0 ? builders : undefined,
    targets: targets.length > 0 ? targets : undefined,
  });

  // Extract distinct builder/target values from initial items for filter dropdowns
  const availableBuilders = Array.from(
    new Set(feed.items.map((item) => item.builder)),
  ).sort();
  const availableTargets = Array.from(
    new Set(feed.items.map((item) => item.target)),
  ).sort();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-canvas">
      {/* Page Header */}
      <div className="flex flex-col gap-6 border-b border-line px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:px-12 sm:py-8">
        <div className="min-w-0 max-w-3xl">
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-[42px] sm:leading-[2.75rem]">
            The wall of questionable taste
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Vote with your whole chest. Fork without shame.
          </p>
        </div>
      </div>

      {/* Feed Content */}
      <div className="flex flex-1 flex-col px-4 py-6 sm:px-12 sm:py-8">
        {feed.items.length === 0 && builders.length === 0 && targets.length === 0 ? (
          <EmptyFeedState />
        ) : (
          <FeedPageClient
            initialItems={feed.items}
            initialSort={sort}
            initialBuilders={builders}
            initialTargets={targets}
            availableBuilders={availableBuilders}
            availableTargets={availableTargets}
          />
        )}
      </div>
    </div>
  );
}

/** Empty state when the feed has no published generations at all */
function EmptyFeedState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-xl bg-panel p-8 max-w-md">
        <p className="text-xl font-bold text-ink">No crimes yet</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This corner is suspiciously well-behaved. Cook the first one.
        </p>
        <Link
          href="/generate"
          className="mt-4 inline-flex items-center justify-center rounded-[7px] bg-ink px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-ink/90"
        >
          Generate one
        </Link>
      </div>
    </div>
  );
}
