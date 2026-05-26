import { describe, expect, it } from "vitest";

import {
  isGenerationInProgress,
  isGenerationStatus,
} from "@/lib/generation/types";

describe("generation status helpers", () => {
  it("detects in-progress statuses", () => {
    expect(isGenerationInProgress("queued")).toBe(true);
    expect(isGenerationInProgress("processing")).toBe(true);
    expect(isGenerationInProgress("completed")).toBe(false);
    expect(isGenerationInProgress("failed")).toBe(false);
  });

  it("validates known statuses", () => {
    expect(isGenerationStatus("queued")).toBe(true);
    expect(isGenerationStatus("nope")).toBe(false);
  });
});
