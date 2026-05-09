import { getServerBaseUrl } from "@/lib/server-base-url";
import type { FeedResponse, FeedSort } from "@/lib/feed-types";

export async function fetchFeedServer(opts: {
  sort: FeedSort;
  limit: number;
  builders?: string[];
  targets?: string[];
}): Promise<FeedResponse> {
  const base = await getServerBaseUrl();
  const params = new URLSearchParams();
  params.set("sort", opts.sort);
  params.set("limit", String(opts.limit));
  if (opts.builders && opts.builders.length > 0) {
    params.set("builder", opts.builders.join(","));
  }
  if (opts.targets && opts.targets.length > 0) {
    params.set("target", opts.targets.join(","));
  }
  const res = await fetch(`${base}/api/feed?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return { sort: opts.sort, items: [], hasMore: false };
  }
  return (await res.json()) as FeedResponse;
}
