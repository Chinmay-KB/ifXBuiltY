import type { FeedResponse, FeedSort } from "@/lib/feed-types";
import { fetchCachedFeedServer } from "@/lib/feed-query";

export async function fetchFeedServer(opts: {
  sort: FeedSort;
  limit: number;
  builders?: string[];
  targets?: string[];
  tones?: string[];
}): Promise<FeedResponse> {
  return fetchCachedFeedServer(opts);
}
