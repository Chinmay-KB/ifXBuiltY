import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatCardLabel } from "../format";

/**
 * Feature: ui-redesign, Property 6: Card label formatting with truncation
 * Validates: Requirements 3.2
 *
 * For any builder string and target string, the card label SHALL equal
 * "{builder} built {target}" when the combined string is 60 characters or fewer,
 * and SHALL be truncated to 60 characters with a trailing ellipsis ("…")
 * when the combined string exceeds 60 characters.
 */
describe("formatCardLabel - Property 6: Card label formatting with truncation", () => {
  // " built " is 7 characters, so builder + target must be <= 53 for the label to fit in 60
  const shortStringArb = fc.string({ minLength: 0, maxLength: 26 });
  // Ensure at least one string is long enough to push past 60 chars total
  const longStringArb = fc.string({ minLength: 30, maxLength: 100 });

  it("should return the full label when combined string is 60 characters or fewer", () => {
    fc.assert(
      fc.property(shortStringArb, shortStringArb, (builder, target) => {
        const fullLabel = `${builder} built ${target}`;
        fc.pre(fullLabel.length <= 60);

        const result = formatCardLabel(builder, target);
        expect(result).toBe(fullLabel);
      }),
      { numRuns: 100 }
    );
  });

  it("should truncate to 60 characters with trailing ellipsis when combined string exceeds 60 characters", () => {
    fc.assert(
      fc.property(longStringArb, longStringArb, (builder, target) => {
        const fullLabel = `${builder} built ${target}`;
        // With both strings >= 30 chars, fullLabel >= 67 chars, always > 60
        const result = formatCardLabel(builder, target);
        expect(result).toBe(fullLabel.slice(0, 60) + "…");
        expect(result.length).toBe(61); // 60 chars + 1 ellipsis character
      }),
      { numRuns: 100 }
    );
  });
});
