import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { hasInputsChanged } from "../format";
import type { GenerationInputs } from "../types";

/**
 * Feature: ui-redesign, Property 14: Regenerate enabled on input change
 *
 * Validates: Requirements 6.8
 *
 * For any GeneratePageState in the "result" phase, if any input field
 * (builder, target, tone, screenType, region, or extraDetails) differs
 * from the values used in the last successful generation, the Regenerate
 * action SHALL be enabled. If all fields match the last generation's values,
 * Regenerate SHALL be disabled.
 */

const generationInputsArb: fc.Arbitrary<GenerationInputs> = fc.record({
  builder: fc.string(),
  target: fc.string(),
  extraDetails: fc.string(),
  tone: fc.option(fc.string(), { nil: undefined }),
});

describe("hasInputsChanged — Property 14: Regenerate enabled on input change", () => {
  it("returns false when current inputs are identical to last inputs", () => {
    fc.assert(
      fc.property(generationInputsArb, (inputs) => {
        // When current and last are the same object values, no change detected
        const current: GenerationInputs = { ...inputs };
        const last: GenerationInputs = { ...inputs };
        expect(hasInputsChanged(current, last)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("returns true when at least one field differs between current and last inputs", () => {
    const fieldNames: (keyof GenerationInputs)[] = [
      "builder",
      "target",
      "extraDetails",
      "tone",
    ];

    fc.assert(
      fc.property(
        generationInputsArb,
        fc.constantFrom(...fieldNames),
        fc.string({ minLength: 1 }),
        (base, field, suffix) => {
          const last: GenerationInputs = { ...base };
          const current: GenerationInputs = { ...base };
          // Mutate exactly one field to guarantee it differs
          if (field === "tone") {
            current.tone = (base.tone ?? "") + suffix;
          } else {
            current[field] = base[field] + suffix;
          }
          expect(hasInputsChanged(current, last)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
