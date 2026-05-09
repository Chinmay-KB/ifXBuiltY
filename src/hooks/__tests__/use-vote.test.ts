import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { renderHook, act } from "@testing-library/react";
import { useVote } from "@/hooks/use-vote";

/**
 * Feature: ui-redesign, Property 3: Optimistic vote with revert on error
 *
 * For any card with initial score N and any vote direction (+1 or -1),
 * the displayed score SHALL immediately update to N+1 or N-1 respectively
 * before the server responds, and SHALL revert to N if the server returns
 * an error response.
 *
 * Validates: Requirements 1.7
 */
describe("Feature: ui-redesign, Property 3: Optimistic vote with revert on error", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("optimistically updates score immediately on vote before server responds", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000, max: 10000 }),
        fc.constantFrom(1 as const, -1 as const),
        (initialScore, direction) => {
          // Mock fetch to return a promise that never resolves during this check
          fetchMock.mockImplementation(
            () =>
              new Promise<Response>(() => {
                // Never resolves — simulates server not yet responding
              })
          );

          const { result, unmount } = renderHook(() =>
            useVote({
              generationId: 1,
              initialScore,
              initialUserVote: null,
            })
          );

          // Initial score should match
          expect(result.current.score).toBe(initialScore);

          // Vote in the given direction
          act(() => {
            result.current.vote(direction);
          });

          // Score should immediately update optimistically
          expect(result.current.score).toBe(initialScore + direction);
          expect(result.current.isPending).toBe(true);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("reverts score to initial value when server returns an error", async () => {
    const testCases = fc.sample(
      fc.record({
        initialScore: fc.integer({ min: -10000, max: 10000 }),
        direction: fc.constantFrom(1 as const, -1 as const),
      }),
      100
    );

    for (const { initialScore, direction } of testCases) {
      // Mock fetch to return an error response
      fetchMock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
          })
        )
      );

      const { result, unmount } = renderHook(() =>
        useVote({
          generationId: 1,
          initialScore,
          initialUserVote: null,
        })
      );

      // Vote in the given direction
      act(() => {
        result.current.vote(direction);
      });

      // Score should be optimistically updated
      expect(result.current.score).toBe(initialScore + direction);

      // Flush the microtask queue to let the fetch promise resolve and state update
      await act(async () => {
        await Promise.resolve();
      });

      // Score should revert to initial value after error
      expect(result.current.score).toBe(initialScore);
      expect(result.current.error).toBe("Vote failed");
      expect(result.current.isPending).toBe(false);

      unmount();
    }
  }, 30000);

  it("score remains updated when server returns success", async () => {
    const testCases = fc.sample(
      fc.record({
        initialScore: fc.integer({ min: -10000, max: 10000 }),
        direction: fc.constantFrom(1 as const, -1 as const),
      }),
      100
    );

    for (const { initialScore, direction } of testCases) {
      // Mock fetch to return success
      fetchMock.mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ success: true }), { status: 200 })
        )
      );

      const { result, unmount } = renderHook(() =>
        useVote({
          generationId: 1,
          initialScore,
          initialUserVote: null,
        })
      );

      // Vote in the given direction
      act(() => {
        result.current.vote(direction);
      });

      // Score should be optimistically updated
      expect(result.current.score).toBe(initialScore + direction);

      // Flush the microtask queue to let the fetch promise resolve
      await act(async () => {
        await Promise.resolve();
      });

      // Score should remain at the optimistic value (confirmed by server)
      expect(result.current.score).toBe(initialScore + direction);
      expect(result.current.error).toBeNull();
      expect(result.current.isPending).toBe(false);

      unmount();
    }
  }, 30000);
});
