import type { FeedSort } from "@/lib/feed-types";

export type FeedUrlParams = {
  sort: FeedSort;
  builders: string[];
  targets: string[];
  tones: string[];
};

export function parseFeedSort(raw: string | null | undefined): FeedSort {
  if (raw === "trending") return "trending";
  if (raw === "top") return "top";
  if (raw === "remixes") return "remixes";
  return "newest";
}

export function parseCommaSeparated(raw: string | null | undefined): string[] {
  if (!raw || raw.trim() === "") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function parseFeedUrlParams(
  searchParams: Pick<URLSearchParams, "get">,
): FeedUrlParams {
  return {
    sort: parseFeedSort(searchParams.get("sort")),
    builders: parseCommaSeparated(searchParams.get("builder")),
    targets: parseCommaSeparated(searchParams.get("target")),
    tones: parseCommaSeparated(searchParams.get("tone")),
  };
}

export function isDefaultFeedUrlParams(params: FeedUrlParams): boolean {
  return (
    params.sort === "newest" &&
    params.builders.length === 0 &&
    params.targets.length === 0 &&
    params.tones.length === 0
  );
}

export function feedUrlParamsKey(params: FeedUrlParams): string {
  return `${params.sort}|${params.builders.join(",")}|${params.targets.join(",")}|${params.tones.join(",")}`;
}

export function buildFeedApiQuery(params: FeedUrlParams, limit = 24): string {
  const query = new URLSearchParams();
  query.set("sort", params.sort);
  query.set("limit", String(limit));
  if (params.builders.length > 0) {
    query.set("builder", params.builders.join(","));
  }
  if (params.targets.length > 0) {
    query.set("target", params.targets.join(","));
  }
  if (params.tones.length > 0) {
    query.set("tone", params.tones.join(","));
  }
  return query.toString();
}
