import { describe, expect, it } from "vitest";

import {
  expandProfileSelectionsToNames,
  namesToProfilePicks,
  type FeedProfileFilterGroup,
} from "@/lib/feed-profile-filter";

const groups: FeedProfileFilterGroup[] = [
  {
    companyId: "google",
    companyName: "Google",
    products: [
      { id: "gmail", name: "Gmail" },
      { id: "maps", name: "Google Maps" },
    ],
  },
];

describe("namesToProfilePicks", () => {
  it("maps company name to company pick", () => {
    expect(namesToProfilePicks(["Google"], groups)).toEqual([
      { kind: "company", companyId: "google" },
    ]);
  });

  it("maps product name to product pick", () => {
    expect(namesToProfilePicks(["Gmail"], groups)).toEqual([
      { kind: "product", companyId: "google", productId: "gmail" },
    ]);
  });

  it("ignores unknown legacy names", () => {
    expect(namesToProfilePicks(["Twitter"], groups)).toEqual([]);
  });
});

describe("expandProfileSelectionsToNames", () => {
  it("expands company pick to company and all products", () => {
    expect(
      expandProfileSelectionsToNames(
        [{ kind: "company", companyId: "google" }],
        groups,
      ),
    ).toEqual(["Google", "Gmail", "Google Maps"]);
  });

  it("expands product pick to a single name", () => {
    expect(
      expandProfileSelectionsToNames(
        [{ kind: "product", companyId: "google", productId: "gmail" }],
        groups,
      ),
    ).toEqual(["Gmail"]);
  });
});
