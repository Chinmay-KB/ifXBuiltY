import Image from "next/image";
import Link from "next/link";
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

import { ShareButton } from "./share-button";

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
      {/* Hero Image */}
      <section className="w-full">
        {gen.imageUrl ? (
          <Image
            src={gen.imageUrl}
            alt={title}
            width={1024}
            height={1024}
            sizes={GENERATION_DETAIL_HERO_SIZES}
            priority
            className="mx-auto h-auto w-full max-h-[600px] rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center rounded-lg bg-panel">
            <p className="font-display text-2xl text-muted">{title}</p>
          </div>
        )}
      </section>

      {/* Generation Meta */}
      <section className="flex flex-col gap-4">
        <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
          {title}
        </h1>

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

      {/* Vote Controls (non-compact) */}
      <section>
        <VoteControls
          generationId={gen.id}
          initialScore={netScore}
          initialUserVote={null}
          compact={false}
        />
      </section>

      {/* Action Buttons: remix, download, share */}
      <section className="flex flex-wrap gap-3">
        <Link
          href={`/remix/${gen.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
              clipRule="evenodd"
            />
          </svg>
          Remix
        </Link>

        {gen.imageDownloadUrl ? (
          <a
            href={gen.imageDownloadUrl}
            download
            className="inline-flex items-center gap-2 rounded-lg border-2 border-ink px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Download
          </a>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border-2 border-ink/30 px-5 py-3 text-sm font-semibold text-ink/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Download
          </span>
        )}

        <ShareButton slug={gen.slug} title={title} />
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
