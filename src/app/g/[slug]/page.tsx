import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GenerationCard } from "@/components/generation-card";
import { VoteControls } from "@/components/vote-controls";
import { fetchFeedServer } from "@/lib/fetch-feed";
import { getPublishedGenerationBySlug } from "@/lib/public-generation";
import { formatResultTitle } from "@/lib/ui/format";
import type { FeedItem } from "@/lib/ui/types";

import { FeedReturnLink } from "./feed-return-link";
import { GenerationDetailActions } from "./generation-detail-actions";
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

  const tone = gen.tone?.trim();
  const screenType = gen.screenType?.trim() || "UI screenshot";

  return (
    <div className="flex flex-col bg-canvas pb-12">
      <div className="flex items-center gap-2 px-5 pt-4 font-mono text-[10px] uppercase tracking-[0.06em] text-muted sm:px-6 sm:pt-5 sm:text-[11px] lg:px-14">
        <FeedReturnLink className="transition-colors hover:text-ink">
          Back to feed
        </FeedReturnLink>
        <span aria-hidden>/</span>
        <span className="text-ink">
          {gen.builder} × {gen.target}
        </span>
      </div>

      <div className="mt-4 grid gap-7 px-5 sm:mt-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-12 lg:px-14">
        <div className="min-w-0 flex-1">
          {gen.imageUrl ? (
            <PublishedGenerationHero
              imageUrl={gen.imageUrl}
              title={title}
              variant="paper"
            />
          ) : (
            <section className="relative flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-3xl bg-panel">
              <p className="font-display text-2xl text-muted">{title}</p>
            </section>
          )}
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-5 sm:gap-6 lg:sticky lg:top-28 lg:self-start">
          <div className="border-b border-line pb-4 sm:pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-chrome px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink">
                Published specimen
              </span>
              <span className="rounded-full bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                {screenType}
              </span>
            </div>
            <h1 className="mt-2 font-display text-[clamp(2.15rem,10vw,3rem)] font-black leading-[0.9] tracking-[-0.04em] text-ink sm:leading-[0.94] sm:tracking-[-0.035em]">
              If {gen.builder}
              <br />
              built {gen.target}.
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
              {tone ? <span>{tone}</span> : null}
              {tone ? <span className="h-1 w-1 rounded-full bg-muted" aria-hidden /> : null}
              <span>Built for the feed</span>
            </div>
          </div>

          <GenerationDetailActions
            generationId={gen.id}
            slug={gen.slug}
            title={title}
            imageDownloadUrl={gen.imageDownloadUrl ?? null}
          />

          <div className="flex items-center justify-between gap-4 rounded-[18px] border border-line bg-canvas px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                Crowd signal
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Vote if the timeline checks out.
              </p>
            </div>
            <VoteControls
              generationId={gen.id}
              initialScore={netScore}
              initialUserVote={null}
              compact={false}
            />
          </div>

          {gen.extraDetails ? (
            <div className="border-l-4 border-chrome py-1 pl-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                Prompt note
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {gen.extraDetails}
              </p>
            </div>
          ) : null}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12 border-t border-line px-5 pt-8 sm:px-6 sm:pt-10 lg:mt-14 lg:px-14">
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
