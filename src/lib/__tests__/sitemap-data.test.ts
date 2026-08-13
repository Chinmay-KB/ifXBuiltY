import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildSitemapEntries,
  getPublicSitemapEntries,
  getStaticSitemapEntries,
  mapPublishedRowsToSitemapEntries,
  parseSitemapLastmod,
} from "@/lib/sitemap-data";

const { createPublicFeedClient } = vi.hoisted(() => ({
  createPublicFeedClient: vi.fn(),
}));

vi.mock("@/lib/feed-client", () => ({
  createPublicFeedClient,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("parseSitemapLastmod", () => {
  it("returns an ISO string for valid timestamps", () => {
    expect(parseSitemapLastmod("2026-08-11T19:41:41.990Z")).toBe(
      "2026-08-11T19:41:41.990Z",
    );
  });

  it("omits invalid, empty, and null dates so XML serialization cannot throw", () => {
    expect(parseSitemapLastmod(undefined)).toBeUndefined();
    expect(parseSitemapLastmod(null)).toBeUndefined();
    expect(parseSitemapLastmod("")).toBeUndefined();
    expect(parseSitemapLastmod("not-a-date")).toBeUndefined();
    expect(parseSitemapLastmod(new Date("invalid"))).toBeUndefined();
  });
});

describe("getStaticSitemapEntries", () => {
  it("always includes marketing routes even with zero mashups", () => {
    const entries = getStaticSitemapEntries("https://xbuildsy.com");
    expect(entries.map((e) => e.url)).toEqual([
      "https://xbuildsy.com",
      "https://xbuildsy.com/feed",
      "https://xbuildsy.com/generate",
      "https://xbuildsy.com/about",
    ]);
  });
});

describe("mapPublishedRowsToSitemapEntries", () => {
  it("skips blank slugs and keeps the newest lastmod per creator", () => {
    const { generations, creators } = mapPublishedRowsToSitemapEntries([
      {
        slug: "youtube-figma",
        creator_id: "creator-a",
        updated_at: "2026-08-11T19:41:39.026Z",
      },
      {
        slug: "  ",
        creator_id: "creator-a",
        updated_at: "2026-08-12T00:00:00.000Z",
      },
      {
        slug: "apple-twitter-x",
        creator_id: "creator-a",
        updated_at: "2026-08-10T00:00:00.000Z",
      },
      {
        slug: "orphan-mashup",
        creator_id: null,
        updated_at: "not-a-date",
      },
    ]);

    expect(generations).toEqual([
      {
        slug: "youtube-figma",
        updatedAt: "2026-08-11T19:41:39.026Z",
      },
      {
        slug: "apple-twitter-x",
        updatedAt: "2026-08-10T00:00:00.000Z",
      },
      { slug: "orphan-mashup", updatedAt: undefined },
    ]);
    expect(creators).toEqual([
      { id: "creator-a", updatedAt: "2026-08-11T19:41:39.026Z" },
    ]);
  });
});

describe("buildSitemapEntries", () => {
  it("returns only static URLs when generations are empty", () => {
    const entries = buildSitemapEntries("https://xbuildsy.com", [], []);
    expect(entries).toEqual(getStaticSitemapEntries("https://xbuildsy.com"));
  });

  it("omits lastModified when the timestamp is missing", () => {
    const entries = buildSitemapEntries(
      "https://xbuildsy.com",
      [{ slug: "youtube-figma" }],
      [{ id: "creator-a" }],
    );
    expect(entries.some((e) => "lastModified" in e)).toBe(false);
    expect(entries.map((e) => e.url)).toContain(
      "https://xbuildsy.com/g/youtube-figma",
    );
    expect(entries.map((e) => e.url)).toContain(
      "https://xbuildsy.com/u/creator-a",
    );
  });

  it("encodes path segments", () => {
    const entries = buildSitemapEntries(
      "https://xbuildsy.com",
      [{ slug: "a/b c", updatedAt: "2026-01-01T00:00:00.000Z" }],
      [],
    );
    expect(entries.map((e) => e.url)).toContain(
      "https://xbuildsy.com/g/a%2Fb%20c",
    );
  });
});

describe("getPublicSitemapEntries", () => {
  it("returns empty lists when the public Supabase client is unavailable", async () => {
    createPublicFeedClient.mockReturnValue(null);
    await expect(getPublicSitemapEntries()).resolves.toEqual({
      generations: [],
      creators: [],
    });
  });

  it("returns empty lists when the generations query throws", async () => {
    createPublicFeedClient.mockReturnValue({
      from: () => {
        throw new Error("supabase down");
      },
    });
    await expect(getPublicSitemapEntries()).resolves.toEqual({
      generations: [],
      creators: [],
    });
  });

  it("maps published rows from a successful query", async () => {
    const result = {
      data: [
        {
          slug: "youtube-figma",
          creator_id: "creator-a",
          updated_at: "2026-08-11T19:41:39.026Z",
        },
      ],
      error: null,
    };
    const query: {
      eq: ReturnType<typeof vi.fn>;
      order: ReturnType<typeof vi.fn>;
      limit: ReturnType<typeof vi.fn>;
    } = {
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn().mockResolvedValue(result),
    };
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    createPublicFeedClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(query),
      }),
    });

    await expect(getPublicSitemapEntries()).resolves.toEqual({
      generations: [
        {
          slug: "youtube-figma",
          updatedAt: "2026-08-11T19:41:39.026Z",
        },
      ],
      creators: [
        { id: "creator-a", updatedAt: "2026-08-11T19:41:39.026Z" },
      ],
    });
  });
});
