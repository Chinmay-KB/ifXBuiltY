import { describe, expect, it } from "vitest";
import { buildGenerationPrompt } from "@/lib/prompt/build-generation-prompt";

describe("buildGenerationPrompt", () => {
  it("mentions product experience in intro", () => {
    const prompt = buildGenerationPrompt({
      builder: "Google Maps",
      target: "Microsoft Teams",
      extraDetails: "Extra",
    });
    expect(prompt).toContain("product experience");
    expect(prompt).toContain("Google Maps");
  });

  it("requires builder and target", () => {
    expect(() =>
      buildGenerationPrompt({ builder: "", target: "X", extraDetails: "" }),
    ).toThrow();
  });

  it("includes explicit aspect framing when screen type is provided", () => {
    const mobile = buildGenerationPrompt({
      builder: "Google",
      target: "YouTube",
      extraDetails: "",
      screenType: "mobile",
    });
    expect(mobile).toContain("9:16");

    const desktop = buildGenerationPrompt({
      builder: "Google",
      target: "YouTube",
      extraDetails: "",
      screenType: "desktop",
    });
    expect(desktop).toContain("16:9");
  });
});
