import { getServerBaseUrl } from "@/lib/server-base-url";
import type { FeedResponse, FeedSort } from "@/lib/feed-types";

export async function fetchFeedServer(opts: {
  sort: FeedSort;
  limit: number;
}): Promise<FeedResponse> {
  const base = await getServerBaseUrl();
  const res = await fetch(
    `${base}/api/feed?sort=${opts.sort}&limit=${opts.limit}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    return { sort: opts.sort, items: [] };
  }
  return (await res.json()) as FeedResponse;
}
