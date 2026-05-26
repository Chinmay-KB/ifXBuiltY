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
 * Remix actions are hidden from the UI for now.
 * This test ensures the feed card never renders remix labels.
 */
describe("GenerationCard - remix labels are hidden", () => {
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

  it("should not render remix labels for any remixCount", () => {
    fc.assert(
      fc.property(
        feedItemArb(fc.integer({ min: 0, max: 10000 })),
        (item) => {
          const { container } = render(<GenerationCard item={item} />);

          expect(container.textContent).not.toMatch(/\d+\s+remix(es)?/);
          expect(container.textContent).not.toContain("Remix");

          container.remove();
        }
      ),
      { numRuns: 100 }
    );
  });
});
