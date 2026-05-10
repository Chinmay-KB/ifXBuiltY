import type { MetadataRoute } from "next";

import { getPublishedGenerationsForSitemap } from "@/lib/sitemap-data";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/feed`,
      lastModified,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${base}/generate`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${base}/images`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.75,
    },
  ];

  const generations = await getPublishedGenerationsForSitemap();
  const generationEntries: MetadataRoute.Sitemap = generations.map((g) => ({
    url: `${base}/g/${encodeURIComponent(g.slug)}`,
    lastModified: g.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...generationEntries];
}
