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
import type { ShowcaseExample } from "@/data/showcase-examples";

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

/** Arbitrary for a single ShowcaseExample */
const showcaseExampleArb: fc.Arbitrary<ShowcaseExample> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  builder: fc.string({ minLength: 1, maxLength: 40 }),
  target: fc.string({ minLength: 1, maxLength: 40 }),
  tone: fc.constantFrom("playful", "serious", "corporate", "absurd"),
  screenType: fc.constantFrom("mobile", "desktop", "tablet", "watch"),
  region: fc.constantFrom("global", "us", "eu", "asia"),
  extraDetails: fc.string({ maxLength: 50 }),
  imageSrc: fc.string({ minLength: 1, maxLength: 30 }).map((s) => `/showcase/${s}.svg`),
  generationSlug: fc.oneof(
    fc.constant(undefined),
    fc.string({ minLength: 1, maxLength: 24 }),
  ),
});

/** Arbitrary for a non-empty array of showcase examples (1-20 items) */
const showcaseExamplesArb: fc.Arbitrary<ShowcaseExample[]> = fc.array(
  showcaseExampleArb,
  { minLength: 1, maxLength: 20 },
);

/** Arbitrary for elapsed time in ms (simulate multiple rotation intervals) */
const elapsedTimeArb: fc.Arbitrary<number> = fc.integer({
  min: 0,
  max: 60000,
});

describe("Property 15: Reduced motion compliance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("slideshow does NOT rotate when prefers-reduced-motion: reduce is active, regardless of examples or time elapsed", () => {
    fc.assert(
      fc.property(
        showcaseExamplesArb,
        elapsedTimeArb,
        (examples, elapsed) => {
          // Arrange: reduced motion active
          window.matchMedia = createMockMatchMedia(true);

          const { container } = render(
            <GenerationLoadingState showcaseExamples={examples} />,
          );

          // Capture initial image state
          const initialImages = container.querySelectorAll("img");
          const initialSrcs = Array.from(initialImages).map((img) =>
            img.getAttribute("src"),
          );
          const initialOpacities = Array.from(initialImages).map((img) =>
            img.className.includes("opacity-100") ? "visible" : "hidden",
          );

          // Act: advance time by random elapsed duration
          act(() => {
            vi.advanceTimersByTime(elapsed);
          });

          // Assert: images should not have changed (no rotation)
          const afterImages = container.querySelectorAll("img");
          const afterSrcs = Array.from(afterImages).map((img) =>
            img.getAttribute("src"),
          );
          const afterOpacities = Array.from(afterImages).map((img) =>
            img.className.includes("opacity-100") ? "visible" : "hidden",
          );

          expect(afterSrcs).toEqual(initialSrcs);
          expect(afterOpacities).toEqual(initialOpacities);

          // Cleanup
          container.remove();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("microcopy does NOT cycle when prefers-reduced-motion: reduce is active, regardless of time elapsed", () => {
    fc.assert(
      fc.property(
        showcaseExamplesArb,
        elapsedTimeArb,
        (examples, elapsed) => {
          // Arrange: reduced motion active
          window.matchMedia = createMockMatchMedia(true);

          const { container } = render(
            <GenerationLoadingState showcaseExamples={examples} />,
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

  it("transition classes use duration-0 when prefers-reduced-motion: reduce is active", () => {
    fc.assert(
      fc.property(showcaseExamplesArb, (examples) => {
        // Arrange: reduced motion active
        window.matchMedia = createMockMatchMedia(true);

        const { container } = render(
          <GenerationLoadingState showcaseExamples={examples} />,
        );

        // Assert: all img elements should have duration-0 class
        const images = container.querySelectorAll("img");
        Array.from(images).forEach((img) => {
          expect(img.className).toContain("duration-0");
          // Should NOT contain the normal slow duration class
          expect(img.className).not.toContain(
            "duration-[var(--transition-duration-slow)]",
          );
        });

        // Assert: microcopy element should also have duration-0
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
