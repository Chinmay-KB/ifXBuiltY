import { describe, expect, it } from "vitest";

import { toGenerationStatusResponse } from "@/lib/generation/status-response";

describe("toGenerationStatusResponse", () => {
  it("returns media URL only when completed with image", () => {
    const completed = toGenerationStatusResponse({
      id: 1,
      slug: "duolingo-built-tinder",
      status: "completed",
      builder: "Duolingo",
      target: "Tinder",
      error_message: null,
      image_path: "user/duolingo-built-tinder.png",
      image_ready: true,
    });
    expect(completed.imageUrl).toContain("/api/generations/");
    expect(completed.imageUrl).toContain("variant=detail");

    const queued = toGenerationStatusResponse({
      id: 2,
      slug: "queued-job",
      status: "queued",
      builder: "A",
      target: "B",
      error_message: null,
      image_path: "user/queued-job.png",
    });
    expect(queued.imageUrl).toBeNull();

    const completedNoMedia = toGenerationStatusResponse({
      id: 4,
      slug: "broken-media",
      status: "completed",
      builder: "A",
      target: "B",
      error_message: null,
      image_path: "user/broken.png",
      image_ready: false,
    });
    expect(completedNoMedia.imageUrl).toBeNull();
  });

  it("maps unknown status to failed", () => {
    const row = toGenerationStatusResponse({
      id: 3,
      slug: "x",
      status: "bogus",
      builder: "A",
      target: "B",
      error_message: "nope",
      image_path: null,
    });
    expect(row.status).toBe("failed");
    expect(row.errorMessage).toBe("nope");
  });
});
