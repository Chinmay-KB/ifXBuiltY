import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { renderHook, act } from "@testing-library/react";
import { useGenerate } from "../use-generate";

/**
 * Feature: ui-redesign, Property 10: Form input preservation on generation error
 *
 * For any set of GenerationInputs (builder, target, tone, screenType, region, extraDetails),
 * if generation fails, all form fields SHALL retain their exact pre-submission values.
 * Activating retry SHALL re-submit the request with the identical preserved input values.
 *
 * Validates: Requirements 5.6, 5.7
 */
describe("Feature: ui-redesign, Property 10: Form input preservation on generation error", () => {
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

  it("after a failed generation, result is null and error is set, and inputs object is not mutated", async () => {
    const testCases = fc.sample(generationInputsArb, 100);

    for (const inputs of testCases) {
      // Deep clone to compare later
      const inputSnapshot = structuredClone(inputs);

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

      await act(async () => {
        await result.current.generate(inputs);
      });

      // After error: result is null and error is set
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);

      // The inputs object passed to generate is NOT mutated
      expect(inputs).toEqual(inputSnapshot);

      unmount();
    }
  }, 30000);

  it("after a network error, result is null and error is set, and inputs object is not mutated", async () => {
    const testCases = fc.sample(generationInputsArb, 100);

    for (const inputs of testCases) {
      const inputSnapshot = structuredClone(inputs);

      // Mock fetch to throw a network error
      fetchMock.mockImplementation(() =>
        Promise.reject(new TypeError("Failed to fetch"))
      );

      const { result, unmount } = renderHook(() => useGenerate());

      await act(async () => {
        await result.current.generate(inputs);
      });

      // After error: result is null and error is set
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);

      // The inputs object is NOT mutated
      expect(inputs).toEqual(inputSnapshot);

      unmount();
    }
  }, 30000);

  it("retry sends the same request body as the original failed attempt", async () => {
    const testCases = fc.sample(generationInputsArb, 100);

    for (const inputs of testCases) {
      // First call: error response
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Temporary failure" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      // Second call (retry): also error (we just need to verify the body)
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: "Still failing" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        )
      );

      const { result, unmount } = renderHook(() => useGenerate());

      // First attempt — fails
      await act(async () => {
        await result.current.generate(inputs);
      });

      expect(result.current.error).toBeTruthy();

      // Retry with the same inputs
      await act(async () => {
        await result.current.generate(inputs);
      });

      // Verify both calls sent the same request body
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const firstCallBody = JSON.parse(
        (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string
      );
      const secondCallBody = JSON.parse(
        (fetchMock.mock.calls[1] as [string, RequestInit])[1].body as string
      );

      expect(firstCallBody).toEqual(secondCallBody);
      expect(firstCallBody).toEqual(inputs);

      unmount();
      fetchMock.mockReset();
    }
  }, 30000);
});
