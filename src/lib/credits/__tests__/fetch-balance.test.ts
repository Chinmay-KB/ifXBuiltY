import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCreditsBalance } from "@/lib/credits/fetch-balance";

describe("fetchCreditsBalance", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns balance data on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ credits: 4, hasCustomer: true }),
      }),
    );

    const result = await fetchCreditsBalance();
    expect(result).toEqual({
      ok: true,
      data: { credits: 4, hasCustomer: true },
    });
  });

  it("returns unauthorized on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      }),
    );

    const result = await fetchCreditsBalance();
    expect(result).toEqual({
      ok: false,
      unauthorized: true,
      error: "Unauthorized",
    });
  });
});
