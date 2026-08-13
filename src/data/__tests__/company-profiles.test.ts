import { describe, expect, it } from "vitest";

import { groupSelectableCompanyProfiles } from "@/data/selectable-company-groups";
import { mockCompanyGroups } from "@/data/test-fixtures/profile-groups";

describe("groupSelectableCompanyProfiles", () => {
  it("keeps every company and only approved products", () => {
    const groups = mockCompanyGroups();
    const youtube = groups.find((g) => g.company.id === "google")!.products[0]!;
    const seedProduct = {
      ...youtube,
      id: "google-m3-expressive",
      name: "M3 Expressive",
      researchStatus: "seed",
    };
    const approvedProduct = {
      ...youtube,
      id: "google-docs",
      name: "Google Docs",
      researchStatus: "approved",
    };

    const result = groupSelectableCompanyProfiles([
      ...groups.map((g) => g.company),
      ...groups.flatMap((g) => g.products),
      seedProduct,
      approvedProduct,
    ]);

    expect(result.map((g) => g.company.id)).toEqual([
      "duolingo",
      "google",
      "ikea",
    ]);
    expect(
      result.find((g) => g.company.id === "google")?.products.map((p) => p.id),
    ).toEqual(["google-docs", "google-youtube"]);
  });
});
