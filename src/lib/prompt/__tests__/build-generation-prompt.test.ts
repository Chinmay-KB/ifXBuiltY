import { describe, expect, it } from "vitest";

import { buildGenerationPrompt } from "@/lib/prompt/build-generation-prompt";

describe("buildGenerationPrompt", () => {
  it("includes branding guardrails and stylistic framing", () => {
    const p = buildGenerationPrompt({
      builder: "Microsoft",
      target: "Indian Government portal",
      extraDetails: "Dense dashboards with tricolor accents.",
    });
    expect(p).toContain("Branding guardrails");
    expect(p).toContain("stylistic reference");
    expect(p).not.toMatch(/as if built by/i);
  });
});
