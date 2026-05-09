import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatCompactCount } from "@/lib/ui/format";

/**
 * Feature: ui-redesign, Property 7: Compact number formatting
 *
 * For any integer n, formatCompactCount(n) SHALL produce:
 * - the raw number as a string when |n| < 1000
 * - a string in the format "{X}k" (with one decimal place when not a whole number
 *   of thousands) when |n| >= 1000
 * - Negative numbers SHALL be prefixed with "−" (U+2212 minus sign)
 *
 * Validates: Requirements 3.3
 */
describe("Feature: ui-redesign, Property 7: Compact number formatting", () => {
  it("returns raw number as string when |n| < 1000", () => {
    fc.assert(
      fc.property(fc.integer({ min: -999, max: 999 }), (n) => {
        const result = formatCompactCount(n);
        const abs = Math.abs(n);
        if (n < 0) {
          expect(result).toBe(`\u2212${abs}`);
        } else {
          expect(result).toBe(`${abs}`);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("returns compact format with 'k' suffix when |n| >= 1000", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 1000, max: 9999999 }),
          fc.integer({ min: -9999999, max: -1000 })
        ),
        (n) => {
          const result = formatCompactCount(n);
          // Must end with "k"
          expect(result.endsWith("k")).toBe(true);

          // Must have correct sign prefix
          if (n < 0) {
            expect(result.startsWith("\u2212")).toBe(true);
          } else {
            expect(result.startsWith("\u2212")).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("uses one decimal place for non-whole thousands, no decimal for whole thousands", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1000, max: 9999999 }), (n) => {
        const result = formatCompactCount(n);
        const rounded = Math.round(n);
        const abs = Math.abs(rounded);
        const k = abs / 1000;

        // Strip the "k" suffix to get the numeric part
        const numericPart = result.replace("k", "");

        if (k % 1 < 0.05) {
          // Whole thousands — no decimal point
          expect(numericPart).toBe(`${Math.round(k)}`);
        } else {
          // Non-whole thousands — one decimal place
          const expected = Number(k.toFixed(1));
          expect(numericPart).toBe(`${expected}`);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("prefixes negative numbers with U+2212 minus sign", () => {
    fc.assert(
      fc.property(fc.integer({ min: -9999999, max: -1 }), (n) => {
        const result = formatCompactCount(n);
        expect(result.startsWith("\u2212")).toBe(true);
        // The rest should not contain another minus sign
        expect(result.slice(1).includes("\u2212")).toBe(false);
        expect(result.slice(1).includes("-")).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
