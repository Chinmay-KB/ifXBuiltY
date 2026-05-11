import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GenerationCard } from "@/components/generation-card";
import { VoteControls } from "@/components/vote-controls";
import { fetchFeedServer } from "@/lib/fetch-feed";
import { getPublishedGenerationBySlug } from "@/lib/public-generation";
import { formatResultTitle } from "@/lib/ui/format";
import type { FeedItem } from "@/lib/ui/types";

import { PublishedGenerationHero } from "./published-generation-hero";

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
  const gen = await getPublishedGenerationBySlug(slug);
  if (!gen) notFound();

  const title = formatResultTitle(gen.builder, gen.target);
  const netScore = gen.upvoteCount - gen.downvoteCount;

  const [byBuilder, byTarget] = await Promise.all([
    fetchFeedServer({ sort: "trending", limit: 6, builders: [gen.builder] }),
    fetchFeedServer({ sort: "trending", limit: 6, targets: [gen.target] }),
  ]);

  const seen = new Set<number>([gen.id]);
  const related: FeedItem[] = [];
  for (const item of [...byBuilder.items, ...byTarget.items]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      related.push(item);
    }
    if (related.length >= 4) break;
  }

  const tone = (gen.tone && gen.tone.trim()) || "Wild";

  return (
    <div className="flex flex-col bg-canvas pb-12">
      <div className="flex items-center gap-2 px-6 pt-5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted lg:px-14">
        <Link href="/feed" className="transition-colors hover:text-ink">
          Feed
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink">
          {gen.builder} × {gen.target}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-10 px-6 lg:flex-row lg:gap-12 lg:px-14">
        <div className="min-w-0 flex-1">
          {gen.imageUrl ? (
            <PublishedGenerationHero
              imageUrl={gen.imageUrl}
              title={title}
              generationId={gen.id}
              slug={gen.slug}
              imageDownloadUrl={gen.imageDownloadUrl ?? null}
              variant="paper"
            />
          ) : (
            <section className="relative flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-3xl bg-panel">
              <p className="font-display text-2xl text-muted">{title}</p>
            </section>
          )}
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-7 lg:w-[400px]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              From the feed
            </p>
            <h1 className="mt-2 font-display text-[clamp(2rem,4vw,3rem)] font-black leading-[0.94] tracking-[-0.035em] text-ink">
              If {gen.builder}
              <br />
              built {gen.target}.
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.04em] text-muted">
              {gen.screenType ? <span>{gen.screenType}</span> : <span>UI</span>}
              <span className="h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden />
              <span>Published</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-2.5">
              {gen.imageDownloadUrl ? (
                <a
                  href={gen.imageDownloadUrl}
                  download
                  className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-full bg-chrome py-4 px-4 font-sans text-base font-bold text-ink transition-opacity hover:opacity-90"
                >
                  Download
                </a>
              ) : null}
              <Link
                href={`/remix/${gen.id}`}
                className="inline-flex size-14 items-center justify-center rounded-full bg-ink text-white"
                aria-label="Remix"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M12 2v13M7 7l5-5 5 5M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href={`/feed?sort=trending`}
                className="flex items-center justify-center rounded-full bg-panel py-3 text-[13px] font-semibold text-ink"
              >
                Save
              </Link>
              <Link
                href={`/remix/${gen.id}`}
                className="flex items-center justify-center rounded-full bg-panel py-3 text-[13px] font-semibold text-ink"
              >
                Remix
              </Link>
              <Link
                href="/about"
                className="flex items-center justify-center rounded-full bg-panel py-3 text-[13px] font-semibold text-ink"
              >
                Report
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <VoteControls
              generationId={gen.id}
              initialScore={netScore}
              initialUserVote={null}
              compact={false}
            />
          </div>

          <div className="rounded-[14px] bg-panel py-4.5 px-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              The seed
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-[22px] font-black italic text-chrome">If</span>
              <span className="font-display text-base font-medium text-ink">{gen.builder}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-[22px] font-black italic text-chrome">built</span>
              <span className="font-display text-base font-medium text-ink">{gen.target}</span>
            </div>
            {tone ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {tone}
              </p>
            ) : null}
          </div>

          {gen.extraDetails ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{gen.extraDetails}</p>
          ) : null}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14 border-t border-line px-6 pt-10 lg:px-14">
          <h2 className="font-display text-xl font-bold text-ink">More like this</h2>
          <div className="mt-6 masonry-feed gap-4">
            {related.map((item) => (
              <div key={item.id} className="mb-4 break-inside-avoid">
                <GenerationCard item={item} variant="paper" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
