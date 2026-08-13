import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { preload } from "react-dom";

import { fetchFeedServer } from "@/lib/fetch-feed";
import { OG_IMAGE_PIXEL_SIZE } from "@/lib/generation-media-url";
import { getGenerationBySlugCached } from "@/lib/public-generation";
import {
  findPublishedSlugAlias,
  publishedGenerationPath,
} from "@/lib/published-slug-alias";
import { formatOgDescription, formatResultTitle } from "@/lib/ui/format";
import type { FeedItem } from "@/lib/ui/types";

import { GenerationDetailClient } from "./generation-detail-client";

type Props = { params: Promise<{ slug: string }> };

async function redirectToPublishedSlugAlias(slug: string): Promise<void> {
  const alias = await findPublishedSlugAlias(slug);
  if (alias) permanentRedirect(publishedGenerationPath(alias));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gen = await getGenerationBySlugCached(slug);

  if (!gen) {
    // Must throw before this metadata is committed; otherwise the response is
    // already 200 HTML ("Not found" + noindex) and permanentRedirect streams.
    await redirectToPublishedSlugAlias(slug);
    return {
      title: "Not found",
      robots: { index: false, follow: false },
    };
  }

  if (gen.status !== "completed") {
    const title = formatResultTitle(gen.builder, gen.target);
    return {
      title: `${title} — Generating`,
      robots: { index: false, follow: false },
    };
  }

  const title = formatResultTitle(gen.builder, gen.target);
  const description = formatOgDescription(gen.builder, gen.target);
  const canonicalPath = `/g/${encodeURIComponent(gen.slug)}`;
  const ogImages = gen.ogImageUrl
    ? [
        {
          url: gen.ogImageUrl,
          width: OG_IMAGE_PIXEL_SIZE.width,
          height: OG_IMAGE_PIXEL_SIZE.height,
          alt: title,
          type: "image/jpeg" as const,
        },
      ]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalPath,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages?.map((img) => img.url),
    },
  };
}

export default async function GenerationDetailPage({ params }: Props) {
  const { slug } = await params;
  const gen = await getGenerationBySlugCached(slug);
  if (!gen) {
    await redirectToPublishedSlugAlias(slug);
    notFound();
  }

  if (gen.status === "completed" && gen.imageUrl) {
    preload(gen.imageUrl, { as: "image" });
  }

  const related: FeedItem[] = [];
  if (gen.status === "completed") {
    const [byBuilder, byTarget] = await Promise.all([
      fetchFeedServer({ sort: "trending", limit: 6, builders: [gen.builder] }),
      fetchFeedServer({ sort: "trending", limit: 6, targets: [gen.target] }),
    ]);

    const seen = new Set<number>([gen.id]);
    for (const item of [...byBuilder.items, ...byTarget.items]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        related.push(item);
      }
      if (related.length >= 4) break;
    }
  }

  return <GenerationDetailClient initial={gen} related={related} />;
}
