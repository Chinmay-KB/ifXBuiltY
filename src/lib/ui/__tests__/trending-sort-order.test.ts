import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { sortFeedItems } from "../feed-filters";
import type { FeedItem } from "../types";

/**
 * Feature: ui-redesign, Property 2: Trending sort order
 * Validates: Requirements 1.6
 *
 * For any list of FeedItems returned with sort="trending", each item's `net_score`
 * SHALL be greater than or equal to the next item's `net_score`, and for items with
 * equal `net_score`, the `created_at` timestamp SHALL be greater than or equal to
 * the next item's `created_at`.
 */
describe("sortFeedItems - Property 2: Trending sort order", () => {
  // Generator for a valid ISO timestamp string
  const isoDateArb = fc
    .integer({ min: 1577836800000, max: 1767225600000 }) // 2020-01-01 to 2025-12-31 in ms
    .map((ms) => new Date(ms).toISOString());

  // Generator for a random FeedItem with varying netScore and createdAt
  const feedItemArb = fc.record({
    id: fc.nat(),
    slug: fc.string({ minLength: 1, maxLength: 20 }),
    builder: fc.string({ minLength: 1, maxLength: 30 }),
    target: fc.string({ minLength: 1, maxLength: 30 }),
    imageUrl: fc.option(fc.webUrl(), { nil: null }),
    netScore: fc.integer({ min: -1000, max: 1000 }),
    remixCount: fc.nat({ max: 500 }),
    createdAt: isoDateArb,
  });

  const feedItemsArb = fc.array(feedItemArb, { minLength: 0, maxLength: 50 });

  it("should sort items by net_score DESC, then created_at DESC for equal scores", () => {
    fc.assert(
      fc.property(feedItemsArb, (items) => {
        const sorted = sortFeedItems(items, "trending");

        // Verify length is preserved
        expect(sorted.length).toBe(items.length);

        // Verify ordering: each item's netScore >= next item's netScore
        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i];
          const next = sorted[i + 1];

          // Primary sort: net_score DESC
          expect(current.netScore).toBeGreaterThanOrEqual(next.netScore);

          // Secondary sort: for equal net_score, created_at DESC
          if (current.netScore === next.netScore) {
            expect(current.createdAt >= next.createdAt).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
