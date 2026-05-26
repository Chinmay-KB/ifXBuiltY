import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { renderHook, act } from "@testing-library/react";
import { useGenerate } from "../use-generate";

/**
 * Feature: ui-redesign, Property 13: Reset clears to defaults
 *
 * For any GeneratePageState in the "result" phase with any combination of user-entered values,
 * activating "Generate another" SHALL clear the generated result, reset all form fields to their
 * default values, and return the page to the "input" phase.
 *
 * The hook doesn't manage form fields directly (the form component does), so we test that
 * the hook's state is properly cleared:
 * 1. Clear `result` to null
 * 2. Clear `error` to null
 * 3. Set `isLoading` to false
 *
 * Validates: Requirements 6.7
 */
describe("Feature: ui-redesign, Property 13: Reset clears to defaults", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  // Generator for arbitrary GenerationInputs
  const generationInputsArb = fc.record({
    builder: fc.string({ minLength: 1, maxLength: 50 }),
    target: fc.string({ minLength: 1, maxLength: 50 }),
    tone: fc.string({ minLength: 0, maxLength: 30 }),
    screenType: fc.string({ minLength: 0, maxLength: 30 }),
    region: fc.string({ minLength: 0, maxLength: 30 }),
    extraDetails: fc.string({ minLength: 0, maxLength: 100 }),
  });

  // Generator for a successful API response
  const successResponseArb = fc.record({
    id: fc.integer({ min: 1, max: 100000 }),
    slug: fc.string({ minLength: 3, maxLength: 30 }),
    status: fc.constantFrom("queued", "processing"),
  });

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("after a successful generation, calling reset() clears result to null, error to null, and isLoading is false", async () => {
    await fc.assert(
      fc.asyncProperty(
        generationInputsArb,
        successResponseArb,
        async (inputs, responseData) => {
          // Mock fetch to return a successful response
          fetchMock.mockImplementation(() =>
            Promise.resolve(
              new Response(JSON.stringify(responseData), {
                status: 202,
                headers: { "Content-Type": "application/json" },
              })
            )
          );

          const { result, unmount } = renderHook(() => useGenerate());

          // Generate successfully
          await act(async () => {
            await result.current.generate(inputs);
          });

          // Verify we're in the "result" phase (result is set)
          expect(result.current.result).not.toBeNull();
          expect(result.current.result?.slug).toBe(responseData.slug);
          expect(result.current.result?.imageUrl).toBeNull();
          expect(result.current.error).toBeNull();
          expect(result.current.isLoading).toBe(false);

          // Call reset (simulates "Generate another")
          act(() => {
            result.current.reset();
          });

          // After reset: all hook state is cleared to defaults
          expect(result.current.result).toBeNull();
          expect(result.current.error).toBeNull();
          expect(result.current.isLoading).toBe(false);

          unmount();
          fetchMock.mockReset();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  it("after a failed generation, calling reset() clears error to null and result remains null", async () => {
    await fc.assert(
      fc.asyncProperty(
        generationInputsArb,
        async (inputs) => {
          // Mock fetch to return an error response
          fetchMock.mockImplementation(() =>
            Promise.resolve(
              new Response(JSON.stringify({ error: "Server error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              })
            )
          );

          const { result, unmount } = renderHook(() => useGenerate());

          // Generate with failure
          await act(async () => {
            await result.current.generate(inputs);
          });

          // Verify we're in the "error" phase
          expect(result.current.result).toBeNull();
          expect(result.current.error).toBeTruthy();
          expect(result.current.isLoading).toBe(false);

          // Call reset
          act(() => {
            result.current.reset();
          });

          // After reset: all hook state is cleared to defaults
          expect(result.current.result).toBeNull();
          expect(result.current.error).toBeNull();
          expect(result.current.isLoading).toBe(false);

          unmount();
          fetchMock.mockReset();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});
