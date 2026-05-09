import { describe, expect, it } from "vitest";

import { buildGenerationPrompt } from "@/lib/prompt/build-generation-prompt";

describe("buildGenerationPrompt", () => {
  it("includes branding guardrails and stylistic framing", () => {
    const p = buildGenerationPrompt({
      builder: "Microsoft",
      target: "Indian Government portal",
      tone: "serious",
      screenType: "desktop web",
      region: "India",
      extraDetails: "Dense dashboards.",
    });
    expect(p).toContain("Branding guardrails");
    expect(p).toContain("stylistic reference");
    expect(p).not.toMatch(/as if built by/i);
  });
});
