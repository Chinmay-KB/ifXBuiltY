import type { Metadata } from "next";
import Link from "next/link";

import { FeedPaperHero } from "@/components/feed-paper-hero";
import { FeedPageClient } from "@/components/feed-page-client";
import { fetchFeedServer } from "@/lib/fetch-feed";
import type { FeedSort } from "@/lib/feed-types";

export const metadata: Metadata = {
  title: "Browse parody screenshots",
  description:
    "Trending and newest AI-generated parody UI screenshots. Vote on brand mashups and filter by builder or target.",
  alternates: { canonical: "/feed" },
};

type Props = {
  searchParams: Promise<{ sort?: string; builder?: string; target?: string; tone?: string }>;
};

function parseSort(raw: string | undefined): FeedSort {
  if (raw === "trending") return "trending";
  if (raw === "top") return "top";
  if (raw === "remixes") return "remixes";
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
  const tones = parseCommaSeparated(params.tone);

  // Server-fetch initial feed items with the parsed params
  const feed = await fetchFeedServer({
    sort,
    limit: 24,
    builders: builders.length > 0 ? builders : undefined,
    targets: targets.length > 0 ? targets : undefined,
    tones: tones.length > 0 ? tones : undefined,
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
      <FeedPaperHero ideasThisWeek={feed.ideasThisWeek ?? 0} />

      <div className="flex flex-1 flex-col pb-10 pt-0">
        {feed.items.length === 0 &&
        builders.length === 0 &&
        targets.length === 0 &&
        tones.length === 0 ? (
          <div className="px-6 lg:px-10">
            <EmptyFeedState />
          </div>
        ) : (
          <FeedPageClient
            initialItems={feed.items}
            initialSort={sort}
            initialBuilders={builders}
            initialTargets={targets}
            initialTones={tones}
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
