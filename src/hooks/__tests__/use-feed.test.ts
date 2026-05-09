/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFeed } from "../use-feed";
import type { FeedItem } from "@/lib/ui/types";

/**
 * Feature: ui-redesign, Property 5: Infinite scroll pagination
 * Validates: Requirements 1.5, 2.9, 2.11
 *
 * For any feed state, calling loadMore when hasMore = true SHALL append between
 * 1 and 20 new items to the existing list without removing or reordering existing
 * items. When hasMore = false, calling loadMore SHALL not modify the items list
 * or trigger a network request.
 */

// Generator for a FeedItem
const feedItemArb = (idOffset: number = 0): fc.Arbitrary<FeedItem> =>
  fc.record({
    id: fc.integer({ min: idOffset + 1, max: idOffset + 100000 }),
    slug: fc.string({ minLength: 1, maxLength: 20 }).map((s) => s.replace(/[^a-z0-9]/gi, "a") || "a"),
    builder: fc.string({ minLength: 1, maxLength: 30 }),
    target: fc.string({ minLength: 1, maxLength: 30 }),
    imageUrl: fc.constant(null),
    netScore: fc.integer({ min: -100, max: 1000 }),
    remixCount: fc.integer({ min: 0, max: 50 }),
    createdAt: fc.constant("2024-01-01T00:00:00Z"),
  });

// Generate a page of items (1 to 20 items, matching the API contract)
const pageArb = fc.array(feedItemArb(), { minLength: 1, maxLength: 20 });

// Generate initial items (0 to 40 items representing already-loaded content)
const initialItemsArb = fc.array(feedItemArb(), { minLength: 0, maxLength: 40 });

describe("useFeed - Property 5: Infinite scroll pagination", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loadMore when hasMore=true appends 1-20 new items without removing or reordering existing items", async () => {
    await fc.assert(
      fc.asyncProperty(initialItemsArb, pageArb, async (initialItems, newPage) => {
        // Reset mock between iterations
        fetchMock.mockReset();

        // Setup: mock fetch to return the new page with hasMore=true
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: newPage, hasMore: true }),
        });

        const { result, unmount } = renderHook(() =>
          useFeed({
            sort: "trending",
            initialItems,
          })
        );

        // Verify initial state
        expect(result.current.items).toEqual(initialItems);
        expect(result.current.hasMore).toBe(true);

        // Call loadMore
        await act(async () => {
          result.current.loadMore();
        });

        // Wait for the fetch to resolve and state to update
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Property: new items are appended (between 1 and 20)
        const appendedCount = result.current.items.length - initialItems.length;
        expect(appendedCount).toBeGreaterThanOrEqual(1);
        expect(appendedCount).toBeLessThanOrEqual(20);

        // Property: existing items are not removed or reordered
        const existingSlice = result.current.items.slice(0, initialItems.length);
        expect(existingSlice).toEqual(initialItems);

        // Property: the appended items match what the API returned
        const appendedSlice = result.current.items.slice(initialItems.length);
        expect(appendedSlice).toEqual(newPage);

        // Verify fetch was called exactly once for this iteration
        expect(fetchMock).toHaveBeenCalledTimes(1);

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it("loadMore when hasMore=false does not modify items or trigger a network request", async () => {
    await fc.assert(
      fc.asyncProperty(initialItemsArb, async (initialItems) => {
        // Reset mock between iterations
        fetchMock.mockReset();

        // First, we need to set up a hook where hasMore becomes false.
        // We do this by providing initial items and then doing one loadMore
        // that returns hasMore=false.
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [], hasMore: false }),
        });

        const { result, unmount } = renderHook(() =>
          useFeed({
            sort: "trending",
            initialItems,
          })
        );

        // First loadMore to set hasMore=false
        await act(async () => {
          result.current.loadMore();
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Now hasMore should be false
        expect(result.current.hasMore).toBe(false);

        // Record the items state and fetch call count
        const itemsBefore = [...result.current.items];
        const fetchCountBefore = fetchMock.mock.calls.length;

        // Call loadMore again — should be a no-op
        await act(async () => {
          result.current.loadMore();
        });

        // Property: items list is not modified
        expect(result.current.items).toEqual(itemsBefore);

        // Property: no additional network request was triggered
        expect(fetchMock.mock.calls.length).toBe(fetchCountBefore);

        // Cleanup
        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
