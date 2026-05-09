import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterFeedItems, type GenerationRecord } from "../feed-filters";

/**
 * Feature: ui-redesign, Property 1: Feed visibility filtering
 * Validates: Requirements 1.1
 *
 * For any set of generation records with mixed visibility and moderation_status values,
 * the feed query SHALL return only those records where visibility = "published" AND
 * moderation_status = "visible" — no other records shall appear in the result.
 */
describe("filterFeedItems - Property 1: Feed visibility filtering", () => {
  // Arbitraries for visibility and moderation_status values
  const visibilityArb = fc.oneof(
    fc.constant("published"),
    fc.constant("draft"),
    fc.constant("archived"),
    fc.string({ minLength: 1, maxLength: 20 }),
  );

  const moderationStatusArb = fc.oneof(
    fc.constant("visible"),
    fc.constant("hidden"),
    fc.constant("pending"),
    fc.string({ minLength: 1, maxLength: 20 }),
  );

  // Arbitrary for a generation record with random visibility/moderation values
  const generationRecordArb: fc.Arbitrary<GenerationRecord> = fc.record({
    id: fc.nat(),
    slug: fc.string({ minLength: 1, maxLength: 30 }),
    builder: fc.string({ minLength: 1, maxLength: 30 }),
    target: fc.string({ minLength: 1, maxLength: 30 }),
    imageUrl: fc.option(fc.webUrl(), { nil: null }),
    netScore: fc.integer({ min: -1000, max: 1000 }),
    remixCount: fc.nat({ max: 100 }),
    createdAt: fc.integer({ min: 946684800000, max: 1924991999999 }).map((ts) => new Date(ts).toISOString()),
    tone: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
      nil: undefined,
    }),
    screenType: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
      nil: undefined,
    }),
    region: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
      nil: undefined,
    }),
    extraDetails: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
      nil: undefined,
    }),
    visibility: visibilityArb,
    moderation_status: moderationStatusArb,
  });

  const recordsArb = fc.array(generationRecordArb, {
    minLength: 0,
    maxLength: 50,
  });

  it("should return only records where visibility is 'published' AND moderation_status is 'visible'", () => {
    fc.assert(
      fc.property(recordsArb, (records) => {
        const result = filterFeedItems(records);

        // Every item in the result must have the correct visibility and moderation_status
        for (const item of result) {
          const source = records.find((r) => r.id === item.id)!;
          expect(source.visibility).toBe("published");
          expect(source.moderation_status).toBe("visible");
        }

        // Every record that matches the criteria must be in the result
        const expected = records.filter(
          (r) =>
            r.visibility === "published" &&
            r.moderation_status === "visible",
        );
        expect(result).toHaveLength(expected.length);
      }),
      { numRuns: 100 },
    );
  });
});
