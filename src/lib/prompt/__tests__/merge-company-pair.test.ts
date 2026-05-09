import { describe, expect, it } from "vitest";

import { mergeCompanyPair } from "@/lib/prompt/merge-company-pair";

describe("mergeCompanyPair", () => {
  it("merges duolingo x microsoft with distinct builder and target names", () => {
    const m = mergeCompanyPair("duolingo", "microsoft");
    expect(m.builder).toBe("Duolingo");
    expect(m.target).toBe("Microsoft");
    expect(m.extraDetails).toContain("Duolingo");
    expect(m.extraDetails).toContain("Microsoft");
    expect(m.tone).toBeTruthy();
    expect(m.screenType).toBeTruthy();
  });

  it("throws when builder equals target", () => {
    expect(() => mergeCompanyPair("linear", "linear")).toThrow(RangeError);
  });

  it("throws for unknown id", () => {
    expect(() => mergeCompanyPair("duolingo", "not-real")).toThrow(RangeError);
  });
});
