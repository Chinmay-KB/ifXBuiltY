import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isGenerateEnabled } from "../format";

/**
 * Feature: ui-redesign, Property 9: Generate button input validation
 * Validates: Requirements 4.3, 4.4
 *
 * For any pair of strings (builder, target), the Generate action SHALL be enabled
 * if and only if builder.trim().length > 0 AND target.trim().length > 0.
 * For all other cases (either field empty or whitespace-only), the Generate action
 * SHALL be disabled.
 */
describe("Feature: ui-redesign, Property 9: Generate button input validation", () => {
  it("returns true if and only if both builder and target are non-empty after trimming", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (builder, target) => {
        const result = isGenerateEnabled(builder, target);
        const expected =
          builder.trim().length > 0 && target.trim().length > 0;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});
