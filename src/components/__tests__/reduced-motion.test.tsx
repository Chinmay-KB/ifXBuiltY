/**
 * Property 15: Reduced motion compliance
 * Feature: ui-redesign, Property 15: Reduced motion compliance
 *
 * Validates: Requirements 9.7
 *
 * For any component with auto-playing animations or transitions, when the
 * user's operating system reports `prefers-reduced-motion: reduce`, all
 * auto-playing animations SHALL be stopped (static equivalents shown) and
 * all CSS transition durations SHALL be set to 0ms.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import * as fc from "fast-check";
import { GenerationLoadingState } from "../generation-loading-state";

// --- Helpers ---

function createMockMatchMedia(reducedMotion: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches:
      query === "(prefers-reduced-motion: reduce)" ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Arbitrary for elapsed time in ms (simulate multiple rotation intervals) */
const elapsedTimeArb: fc.Arbitrary<number> = fc.integer({
  min: 0,
  max: 60000,
});

/** Arbitrary for builder names */
const builderArb: fc.Arbitrary<string> = fc.constantFrom(
  "Duolingo",
  "IKEA",
  "Robinhood",
  "LinkedIn",
  "Spotify",
  "Apple",
  "Google",
  "",
);

describe("Property 15: Reduced motion compliance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("microcopy does NOT cycle when prefers-reduced-motion: reduce is active, regardless of time elapsed", () => {
    fc.assert(
      fc.property(
        builderArb,
        elapsedTimeArb,
        (builder, elapsed) => {
          // Arrange: reduced motion active
          window.matchMedia = createMockMatchMedia(true);

          const { container } = render(
            <GenerationLoadingState builder={builder} />,
          );

          // Capture initial microcopy text
          const microcopyEl = container.querySelector('[aria-atomic="true"]');
          const initialText = microcopyEl?.textContent;

          // Act: advance time
          act(() => {
            vi.advanceTimersByTime(elapsed);
          });

          // Assert: microcopy should remain unchanged (no cycling)
          const afterText = microcopyEl?.textContent;
          expect(afterText).toBe(initialText);

          // Cleanup
          container.remove();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("microcopy element uses duration-0 class when prefers-reduced-motion: reduce is active", () => {
    fc.assert(
      fc.property(builderArb, (builder) => {
        // Arrange: reduced motion active
        window.matchMedia = createMockMatchMedia(true);

        const { container } = render(
          <GenerationLoadingState builder={builder} />,
        );

        // Assert: microcopy element should have duration-0
        const microcopyEl = container.querySelector('[aria-atomic="true"]');
        if (microcopyEl) {
          expect(microcopyEl.className).toContain("duration-0");
        }

        // Cleanup
        container.remove();
      }),
      { numRuns: 100 },
    );
  });
});
