import { describe, expect, it } from "vitest";

import { getAllFunFacts } from "@/data/loading-entertainment";

describe("loading entertainment facts coverage", () => {
  it("returns at least three facts for curated and unknown builders", () => {
    const curated = getAllFunFacts("Duolingo", "duolingo");
    expect(curated.length).toBeGreaterThanOrEqual(3);

    const dynamic = getAllFunFacts("Acme Corp", "acme-corp");
    expect(dynamic.length).toBeGreaterThanOrEqual(3);
    expect(dynamic.some((f) => f.includes("Acme Corp"))).toBe(true);
  });
});
