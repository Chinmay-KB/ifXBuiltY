import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { render } from "@testing-library/react";
import { GenerationCard } from "../generation-card";
import type { FeedItem } from "@/lib/ui/types";

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children?: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

/**
 * Feature: ui-redesign, Property 8: Remix count conditional display
 * Validates: Requirements 3.8
 *
 * For any FeedItem, the card SHALL display the remix count as a visible label
 * if and only if remixCount >= 1. When remixCount === 0, no remix count label
 * SHALL be rendered.
 */
describe("GenerationCard - Property 8: Remix count conditional display", () => {
  // Arbitrary for a valid FeedItem with a controlled remixCount
  const feedItemArb = (remixCountArb: fc.Arbitrary<number>): fc.Arbitrary<FeedItem> =>
    fc.record({
      id: fc.nat(),
      slug: fc.string({ minLength: 1, maxLength: 20 }).map((s) =>
        s.replace(/[^a-z0-9-]/gi, "a")
      ),
      builder: fc.string({ minLength: 1, maxLength: 30 }),
      target: fc.string({ minLength: 1, maxLength: 30 }),
      imageUrl: fc.constant(null),
      netScore: fc.integer({ min: -10000, max: 10000 }),
      remixCount: remixCountArb,
      createdAt: fc.integer({ min: 1577836800000, max: 1893456000000 }).map((ts) => new Date(ts).toISOString()),
    });

  it("should display remix count label when remixCount >= 1", () => {
    fc.assert(
      fc.property(
        feedItemArb(fc.integer({ min: 1, max: 10000 })),
        (item) => {
          const { container } = render(<GenerationCard item={item} />);

          // The remix count badge should be present
          const expectedText = item.remixCount === 1
            ? "1 remix"
            : `${item.remixCount} remixes`;

          expect(container.textContent).toContain(expectedText);

          // Clean up for next iteration
          container.remove();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should NOT display remix count label when remixCount === 0", () => {
    fc.assert(
      fc.property(
        feedItemArb(fc.constant(0)),
        (item) => {
          const { container } = render(<GenerationCard item={item} />);

          // No remix/remixes text should appear
          expect(container.textContent).not.toMatch(/\d+\s+remix(es)?/);

          // Clean up for next iteration
          container.remove();
        }
      ),
      { numRuns: 100 }
    );
  });
});
