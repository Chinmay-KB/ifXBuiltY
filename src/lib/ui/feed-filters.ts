import type { FeedItem, FeedSort } from "./types";

/**
 * Represents a generation record before visibility filtering is applied.
 * Includes the visibility and moderation_status fields that determine
 * whether a record should appear in the public feed.
 */
export type GenerationRecord = FeedItem & {
  visibility: string;
  moderation_status: string;
};

/**
 * Filters generation records to return only those that should appear in the public feed.
 * A record is included if and only if:
 *   - visibility === "published"
 *   - moderation_status === "visible"
 *
 * This mirrors the `.eq("visibility", "published").eq("moderation_status", "visible")`
 * filters applied in the /api/feed route.
 */
export function filterFeedItems(records: GenerationRecord[]): FeedItem[] {
  return records.filter(
    (record) =>
      record.visibility === "published" &&
      record.moderation_status === "visible",
  );
}

/**
 * Apply feed filters with intersection logic.
 *
 * - If both builders and targets are non-empty: return items where item.builder IN builders AND item.target IN targets
 * - If only builders is non-empty: return items where item.builder IN builders
 * - If only targets is non-empty: return items where item.target IN targets
 * - If both are empty: return all items
 */
export function applyFeedFilters(
  items: FeedItem[],
  builders: string[],
  targets: string[]
): FeedItem[] {
  const hasBuilders = builders.length > 0;
  const hasTargets = targets.length > 0;

  if (!hasBuilders && !hasTargets) {
    return items;
  }

  const builderSet = new Set(builders);
  const targetSet = new Set(targets);

  return items.filter((item) => {
    if (hasBuilders && hasTargets) {
      return builderSet.has(item.builder) && targetSet.has(item.target);
    }
    if (hasBuilders) {
      return builderSet.has(item.builder);
    }
    return targetSet.has(item.target);
  });
}

/**
 * Sorts an array of FeedItems according to the specified sort strategy.
 *
 * - "trending": net_score DESC, then created_at DESC for ties
 * - "newest": created_at DESC
 * - "top": net_score DESC
 *
 * Returns a new sorted array (does not mutate the input).
 */
export function sortFeedItems(items: FeedItem[], sort: FeedSort): FeedItem[] {
  const sorted = [...items];

  switch (sort) {
    case "trending":
      sorted.sort((a, b) => {
        if (b.netScore !== a.netScore) {
          return b.netScore - a.netScore;
        }
        // For equal net_score, sort by created_at DESC
        return b.createdAt.localeCompare(a.createdAt);
      });
      break;

    case "newest":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;

    case "top":
      sorted.sort((a, b) => b.netScore - a.netScore);
      break;
  }

  return sorted;
}
