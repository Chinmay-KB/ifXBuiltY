import { describe, expect, it } from "vitest";

import { isNumericSlugAlias, makeGenerationSlugSnippet } from "@/lib/slug";

describe("isNumericSlugAlias", () => {
  it("matches the live uniqueness suffix, not unrelated slugs", () => {
    expect(
      isNumericSlugAlias("microsoft-teams-tinder", "microsoft-teams-tinder-1"),
    ).toBe(true);
    expect(
      isNumericSlugAlias("microsoft-teams-tinder", "microsoft-teams-tinder"),
    ).toBe(true);
    expect(
      isNumericSlugAlias("microsoft-teams-tinder", "microsoft-teams-tinder-box"),
    ).toBe(false);
    expect(
      isNumericSlugAlias("microsoft-teams-tinder", "spotify-tinder"),
    ).toBe(false);
  });

  it("builds the colliding base slug from builder and target", () => {
    expect(
      makeGenerationSlugSnippet({
        builder: "Microsoft Teams",
        target: "Tinder",
      }),
    ).toBe("microsoft-teams-tinder");
  });
});
