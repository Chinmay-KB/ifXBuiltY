import type { MetadataRoute } from "next";

import {
  buildSitemapEntries,
  getPublicSitemapEntries,
  getStaticSitemapEntries,
} from "@/lib/sitemap-data";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  try {
    const { generations, creators } = await getPublicSitemapEntries();
    return buildSitemapEntries(base, generations, creators);
  } catch {
    return getStaticSitemapEntries(base);
  }
}
