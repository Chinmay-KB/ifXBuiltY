import { describe, expect, it } from "vitest";

import { formatOgDescription } from "../format";

describe("formatOgDescription", () => {
  it("is a one-line joke from builder and target, not the locker template", () => {
    const description = formatOgDescription("Microsoft Teams", "Tinder");
    expect(description).toBe(
      "What if Microsoft Teams built Tinder? The UI is the punchline.",
    );
    expect(description.includes("\n")).toBe(false);
    expect(description.toLowerCase()).not.toContain("evidence locker");
  });
});
