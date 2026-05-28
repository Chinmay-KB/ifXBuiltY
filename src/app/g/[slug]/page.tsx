import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { preload } from "react-dom";

import { fetchFeedServer } from "@/lib/fetch-feed";
import { getGenerationBySlugCached } from "@/lib/public-generation";
import { formatResultTitle } from "@/lib/ui/format";
import type { FeedItem } from "@/lib/ui/types";

import { GenerationDetailClient } from "./generation-detail-client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gen = await getGenerationBySlugCached(slug);

  if (!gen) {
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
  const description = `A cursed AI UI screenshot from the ifXBuiltY evidence locker: ${title}.`;
  const canonicalPath = `/g/${encodeURIComponent(gen.slug)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalPath,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function GenerationDetailPage({ params }: Props) {
  const { slug } = await params;
  const gen = await getGenerationBySlugCached(slug);
  if (!gen) notFound();

  if (gen.status === "completed" && gen.imageUrl) {
    preload(gen.imageUrl, { as: "image" });
  }

  let related: FeedItem[] = [];
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
