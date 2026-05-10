import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GenerationCard } from "@/components/generation-card";
import { VoteControls } from "@/components/vote-controls";
import { fetchFeedServer } from "@/lib/fetch-feed";
import { GENERATION_DETAIL_HERO_SIZES } from "@/lib/generation-image-sizes";
import { generationMediaAbsoluteUrl } from "@/lib/generation-media-url";
import { getPublishedGenerationBySlug } from "@/lib/public-generation";
import { getSiteUrl } from "@/lib/site-url";
import { formatResultTitle } from "@/lib/ui/format";
import type { FeedItem } from "@/lib/ui/types";

import { ImageOverlayActions } from "./image-overlay-actions";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gen = await getPublishedGenerationBySlug(slug);

  if (!gen) {
    return {
      title: "Not found",
      robots: { index: false, follow: false },
    };
  }

  const title = formatResultTitle(gen.builder, gen.target);
  const description = `AI-generated parody UI screenshot: ${title}.`;
  const base = getSiteUrl();
  const canonicalPath = `/g/${encodeURIComponent(gen.slug)}`;
  const ogImage =
    gen.imageUrl != null
      ? generationMediaAbsoluteUrl(base, gen.slug, "detail")
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
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1024,
              height: 1024,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : ["/icon.png"],
    },
  };
}

export default async function GenerationDetailPage({ params }: Props) {
  const { slug } = await params;
  const gen = await getPublishedGenerationBySlug(slug);
  if (!gen) notFound();

  const title = formatResultTitle(gen.builder, gen.target);
  const netScore = gen.upvoteCount - gen.downvoteCount;

  // Fetch related generations (same builder or target)
  const [byBuilder, byTarget] = await Promise.all([
    fetchFeedServer({ sort: "trending", limit: 6, builders: [gen.builder] }),
    fetchFeedServer({ sort: "trending", limit: 6, targets: [gen.target] }),
  ]);

  // Merge and deduplicate, excluding the current generation
  const seen = new Set<number>([gen.id]);
  const related: FeedItem[] = [];
  for (const item of [...byBuilder.items, ...byTarget.items]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      related.push(item);
    }
    if (related.length >= 4) break;
  }

  return (
    <div className="flex flex-col gap-8 px-4 py-8 sm:px-8 lg:px-12">
      {/* Hero Image with overlay action buttons */}
      <section className="relative mx-auto w-full max-w-[600px]">
        {gen.imageUrl ? (
          <>
            <Image
              src={gen.imageUrl}
              alt={title}
              width={1024}
              height={1024}
              sizes={GENERATION_DETAIL_HERO_SIZES}
              priority
              className="h-auto w-full max-h-[600px] rounded-lg object-contain"
            />
            <ImageOverlayActions
              generationId={gen.id}
              slug={gen.slug}
              title={title}
              imageDownloadUrl={gen.imageDownloadUrl ?? null}
            />
          </>
        ) : (
          <div className="flex h-64 w-full items-center justify-center rounded-lg bg-panel">
            <p className="font-display text-2xl text-muted">{title}</p>
          </div>
        )}
      </section>

      {/* Generation Meta + Vote Controls side by side */}
      <section className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            {title}
          </h1>

          {/* Vote Controls inline with title */}
          <div className="shrink-0">
            <VoteControls
              generationId={gen.id}
              initialScore={netScore}
              initialUserVote={null}
              compact={false}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {gen.tone && (
            <span className="rounded-full bg-panel px-3 py-1.5 text-sm font-medium text-ink">
              {gen.tone}
            </span>
          )}
          {gen.screenType && (
            <span className="rounded-full bg-panel px-3 py-1.5 text-sm font-medium text-ink">
              {gen.screenType}
            </span>
          )}
          {gen.region && (
            <span className="rounded-full bg-panel px-3 py-1.5 text-sm font-medium text-ink">
              {gen.region}
            </span>
          )}
        </div>

        {gen.extraDetails && (
          <p className="text-base leading-relaxed text-muted-foreground">
            {gen.extraDetails}
          </p>
        )}
      </section>

      {/* Related Grid */}
      {related.length > 0 && (
        <section className="flex flex-col gap-4 border-t border-line pt-8">
          <h2 className="text-xl font-bold text-ink">More like this</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <GenerationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
