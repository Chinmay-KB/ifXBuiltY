import { describe, expect, it } from "vitest";

import {
  formatScreenBadge,
  formatScreenLabel,
  getDisplayAspectClass,
  getGenerationImageSize,
  normalizeRenderMode,
  normalizeScreenType,
  screenTypePromptFragment,
} from "@/lib/screen-type";

describe("screen-type", () => {
  it("normalizes legacy aliases to mobile or desktop", () => {
    expect(normalizeRenderMode("web")).toBe("desktop");
    expect(normalizeRenderMode("mobile")).toBe("mobile");
    expect(normalizeRenderMode("mobile app")).toBe("mobile");
    expect(normalizeRenderMode("desktop web")).toBe("desktop");
    expect(normalizeRenderMode("TV")).toBe("desktop");
    expect(normalizeScreenType("kiosk")).toBe("desktop");
  });

  it("maps render modes to generation sizes", () => {
    expect(getGenerationImageSize("mobile")).toBe("1024x1792");
    expect(getGenerationImageSize("desktop")).toBe("1792x1024");
  });

  it("provides display aspect classes", () => {
    expect(getDisplayAspectClass("mobile")).toBe("aspect-square");
    expect(getDisplayAspectClass("desktop web")).toBe("aspect-[7/4]");
  });

  it("formats badges and labels", () => {
    expect(formatScreenBadge("mobile app")).toBe("Mobile");
    expect(formatScreenLabel("desktop")).toBe("Desktop");
  });

  it("includes explicit ratio language in prompt fragments", () => {
    expect(screenTypePromptFragment("mobile")).toContain("9:16");
    expect(screenTypePromptFragment("desktop")).toContain("16:9");
  });
});
