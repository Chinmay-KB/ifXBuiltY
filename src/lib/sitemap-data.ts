import { createPublicFeedClient } from "@/lib/feed-client";
import { publicGenerationsQuery } from "@/lib/feed-public-filters";

/** Leave headroom under Google's 50_000 URL sitemap cap for static + creator URLs. */
const SITEMAP_GENERATION_LIMIT = 40_000;

export type SitemapUrlEntry = {
  url: string;
  lastModified?: string;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
};

export type SitemapGenerationRow = {
  slug: string;
  updatedAt?: string;
};

export type SitemapCreatorRow = {
  id: string;
  updatedAt?: string;
};

type PublishedSitemapRow = {
  slug: unknown;
  creator_id: unknown;
  updated_at: unknown;
};

export function parseSitemapLastmod(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function isSitemapPathSegment(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function getStaticSitemapEntries(base: string): SitemapUrlEntry[] {
  return [
    {
      url: base,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/feed`,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${base}/generate`,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${base}/about`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}

export function mapPublishedRowsToSitemapEntries(
  rows: PublishedSitemapRow[],
): {
  generations: SitemapGenerationRow[];
  creators: SitemapCreatorRow[];
} {
  const generations: SitemapGenerationRow[] = [];
  const byCreator = new Map<string, string | undefined>();

  for (const row of rows) {
    if (!isSitemapPathSegment(row.slug)) continue;
    const updatedAt = parseSitemapLastmod(row.updated_at);
    generations.push({ slug: row.slug, updatedAt });

    if (!isSitemapPathSegment(row.creator_id)) continue;
    const prev = byCreator.get(row.creator_id);
    if (!prev || (updatedAt && updatedAt > prev)) {
      byCreator.set(row.creator_id, updatedAt);
    }
  }

  return {
    generations,
    creators: [...byCreator.entries()].map(([id, updatedAt]) => ({
      id,
      updatedAt,
    })),
  };
}

export function buildSitemapEntries(
  base: string,
  generations: SitemapGenerationRow[],
  creators: SitemapCreatorRow[],
): SitemapUrlEntry[] {
  const generationEntries: SitemapUrlEntry[] = generations.map((g) => ({
    url: `${base}/g/${encodeURIComponent(g.slug)}`,
    ...(g.updatedAt ? { lastModified: g.updatedAt } : {}),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const creatorEntries: SitemapUrlEntry[] = creators.map((c) => ({
    url: `${base}/u/${encodeURIComponent(c.id)}`,
    ...(c.updatedAt ? { lastModified: c.updatedAt } : {}),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    ...getStaticSitemapEntries(base),
    ...generationEntries,
    ...creatorEntries,
  ];
}

async function fetchPublishedSitemapRows(): Promise<PublishedSitemapRow[]> {
  const supabase = createPublicFeedClient();
  if (!supabase) return [];

  const { data, error } = await publicGenerationsQuery(
    supabase,
    "slug, creator_id, updated_at",
  )
    .order("updated_at", { ascending: false })
    .limit(SITEMAP_GENERATION_LIMIT);

  if (error || !data) return [];
  return data as PublishedSitemapRow[];
}

/**
 * Public mashup + creator URLs for the sitemap.
 * Uses the cookie-less anon client so `/sitemap.xml` can be cached (ISR) and
 * never depends on `cookies()` / request-time APIs. Failures return empty lists
 * so the static routes still render as valid XML.
 */
export async function getPublicSitemapEntries(): Promise<{
  generations: SitemapGenerationRow[];
  creators: SitemapCreatorRow[];
}> {
  try {
    const rows = await fetchPublishedSitemapRows();
    return mapPublishedRowsToSitemapEntries(rows);
  } catch {
    return { generations: [], creators: [] };
  }
}
