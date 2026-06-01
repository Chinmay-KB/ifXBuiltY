import type { MetadataRoute } from "next";

import {
  getPublicCreatorsForSitemap,
  getPublishedGenerationsForSitemap,
} from "@/lib/sitemap-data";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = [
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

  const [generations, creators] = await Promise.all([
    getPublishedGenerationsForSitemap(),
    getPublicCreatorsForSitemap(),
  ]);

  const generationEntries: MetadataRoute.Sitemap = generations.map((g) => ({
    url: `${base}/g/${encodeURIComponent(g.slug)}`,
    lastModified: g.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const creatorEntries: MetadataRoute.Sitemap = creators.map((c) => ({
    url: `${base}/u/${encodeURIComponent(c.id)}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...generationEntries, ...creatorEntries];
}
