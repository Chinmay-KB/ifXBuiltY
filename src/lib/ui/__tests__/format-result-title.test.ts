import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatResultTitle } from "../format";

/**
 * Feature: ui-redesign, Property 11: Result title formatting
 *
 * For any builder and target strings in a completed generation,
 * the result view title SHALL be displayed as exactly "if {builder} built {target}".
 *
 * Validates: Requirements 6.3
 */
describe("formatResultTitle", () => {
  it("should format result title as exactly 'if {builder} built {target}' for any builder and target strings", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (builder, target) => {
        const result = formatResultTitle(builder, target);
        expect(result).toBe(`if ${builder} built ${target}`);
      }),
      { numRuns: 100 }
    );
  });
});
