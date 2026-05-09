import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { applyFeedFilters } from "../feed-filters";
import type { FeedItem } from "../types";

/**
 * Feature: ui-redesign, Property 4: Feed filtering with intersection logic
 * Validates: Requirements 2.3, 2.4, 2.5
 *
 * For any set of FeedItems and any combination of selected builder values and
 * selected target values, the filtered result SHALL contain only items where
 * the item's builder is in the selected builders set AND the item's target is
 * in the selected targets set. When only one filter type is active, items need
 * only match that filter.
 */

// Generator for a FeedItem with constrained builder/target from a known pool
const feedItemArb = (builderPool: string[], targetPool: string[]) =>
  fc.record({
    id: fc.integer({ min: 1, max: 100000 }),
    slug: fc.string({ minLength: 1, maxLength: 20 }),
    builder: fc.constantFrom(...builderPool),
    target: fc.constantFrom(...targetPool),
    imageUrl: fc.constant(null),
    netScore: fc.integer({ min: -100, max: 1000 }),
    remixCount: fc.integer({ min: 0, max: 50 }),
    createdAt: fc.constant("2024-01-01T00:00:00Z"),
  }) as fc.Arbitrary<FeedItem>;

// Pool of possible builder and target values
const builderPool = ["Duolingo", "Apple", "Spotify", "Stripe", "Notion", "Figma", "Slack"];
const targetPool = ["LinkedIn", "Tinder", "Airport", "DMV", "Pharmacy", "Kindergarten", "Funeral"];

describe("applyFeedFilters - Property 4: Feed filtering with intersection logic", () => {
  const itemsArb = fc.array(feedItemArb(builderPool, targetPool), { minLength: 0, maxLength: 50 });
  const builderSubsetArb = fc.subarray(builderPool, { minLength: 0 });
  const targetSubsetArb = fc.subarray(targetPool, { minLength: 0 });

  it("filtered result contains only items matching the intersection of selected builders AND targets", () => {
    fc.assert(
      fc.property(
        itemsArb,
        builderSubsetArb,
        targetSubsetArb,
        (items, selectedBuilders, selectedTargets) => {
          const result = applyFeedFilters(items, selectedBuilders, selectedTargets);

          const hasBuilders = selectedBuilders.length > 0;
          const hasTargets = selectedTargets.length > 0;

          const builderSet = new Set(selectedBuilders);
          const targetSet = new Set(selectedTargets);

          // Every item in the result must satisfy the filter criteria
          for (const item of result) {
            if (hasBuilders && hasTargets) {
              expect(builderSet.has(item.builder)).toBe(true);
              expect(targetSet.has(item.target)).toBe(true);
            } else if (hasBuilders) {
              expect(builderSet.has(item.builder)).toBe(true);
            } else if (hasTargets) {
              expect(targetSet.has(item.target)).toBe(true);
            }
          }

          // Every item from the original that satisfies the criteria must be in the result
          const expected = items.filter((item) => {
            if (hasBuilders && hasTargets) {
              return builderSet.has(item.builder) && targetSet.has(item.target);
            }
            if (hasBuilders) {
              return builderSet.has(item.builder);
            }
            if (hasTargets) {
              return targetSet.has(item.target);
            }
            return true;
          });

          expect(result).toEqual(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
