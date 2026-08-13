import { afterEach, describe, expect, it, vi } from "vitest";

import {
  generationDetailSlugFromPathname,
  publishedGenerationPath,
  resolvePublishedSlugAliasRedirect,
} from "@/lib/published-slug-alias";

const { createPublicFeedClient } = vi.hoisted(() => ({
  createPublicFeedClient: vi.fn(),
}));

vi.mock("@/lib/feed-client", () => ({
  createPublicFeedClient,
}));

afterEach(() => {
  vi.clearAllMocks();
});

function mockGenerationsQuery(
  results: Array<{ data: unknown; error: { message: string } | null }>,
) {
  const query: {
    eq: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    like: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(),
    in: vi.fn(),
    like: vi.fn(),
    limit: vi.fn(),
  };
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.like.mockReturnValue(query);
  for (const result of results) {
    query.limit.mockResolvedValueOnce(result);
  }
  createPublicFeedClient.mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(query),
    }),
  });
  return query;
}

describe("generationDetailSlugFromPathname", () => {
  it("reads a single /g/{slug} segment", () => {
    expect(generationDetailSlugFromPathname("/g/microsoft-teams-tinder")).toBe(
      "microsoft-teams-tinder",
    );
    expect(
      generationDetailSlugFromPathname("/g/microsoft-teams-tinder/"),
    ).toBe("microsoft-teams-tinder");
    expect(generationDetailSlugFromPathname("/g/foo/bar")).toBeNull();
    expect(generationDetailSlugFromPathname("/feed")).toBeNull();
  });
});

describe("publishedGenerationPath", () => {
  it("encodes the alias path", () => {
    expect(publishedGenerationPath("microsoft-teams-tinder-1")).toBe(
      "/g/microsoft-teams-tinder-1",
    );
  });
});

describe("resolvePublishedSlugAliasRedirect", () => {
  it("returns the lowest numeric alias when the exact slug is not published", async () => {
    mockGenerationsQuery([
      { data: [], error: null },
      {
        data: [
          { slug: "microsoft-teams-tinder-2" },
          { slug: "microsoft-teams-tinder-1" },
          { slug: "microsoft-teams-tinder-box" },
        ],
        error: null,
      },
    ]);

    await expect(
      resolvePublishedSlugAliasRedirect("microsoft-teams-tinder"),
    ).resolves.toBe("microsoft-teams-tinder-1");
  });

  it("does not redirect when the exact slug is already a published generation", async () => {
    mockGenerationsQuery([
      { data: [{ slug: "youtube-figma" }], error: null },
    ]);

    await expect(
      resolvePublishedSlugAliasRedirect("youtube-figma"),
    ).resolves.toBeNull();
  });

  it("returns null when no numeric alias exists", async () => {
    mockGenerationsQuery([
      { data: [], error: null },
      { data: [], error: null },
    ]);

    await expect(
      resolvePublishedSlugAliasRedirect("no-such-mashup"),
    ).resolves.toBeNull();
  });
});
