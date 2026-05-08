import Link from "next/link";
import { notFound } from "next/navigation";

import { CookOneLink } from "@/components/cook-one-link";
import { FeedTile } from "@/components/feed-tile";
import { GenerationVoteBar } from "@/components/generation-vote-bar";
import { SiteHeader } from "@/components/site-header";
import { MicroLabel, Surface } from "@/components/ui";
import { fetchFeedServer } from "@/lib/fetch-feed";
import { formatCompactCount } from "@/lib/format-count";
import { getPublishedGenerationBySlug } from "@/lib/public-generation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export default async function GenerationPublicPage({ params }: Props) {
  const { slug } = await params;
  const gen = await getPublishedGenerationBySlug(slug);
  if (!gen) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const related = await fetchFeedServer({ sort: "trending", limit: 12 });
  const others = related.items.filter((x) => x.slug !== gen.slug).slice(0, 4);

  const title = `if ${gen.builder} built ${gen.target}`;
  const netVotes = gen.upvoteCount - gen.downvoteCount;
  const blurb =
    gen.extraDetails?.trim() ||
    "A streak-obsessed security ritual wearing a very serious product mask.";

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <SiteHeader user={user} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-12">
        <p className="text-sm font-semibold text-muted">Specimen view</p>
        <CookOneLink />
      </div>

      <main className="flex flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-12 sm:py-10 lg:flex-row lg:items-start">
        <section className="flex w-full shrink-0 flex-col gap-6 rounded-lg bg-ink p-6 sm:p-9 lg:max-w-[min(100%,520px)]">
          <div className="flex items-start justify-between gap-3">
            <MicroLabel tone="chrome-on-dark">Link bait preview</MicroLabel>
            <span className="text-[13px] text-on-dark-muted">timeline-ready</span>
          </div>
          {gen.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gen.imageUrl}
              alt=""
              className="w-full rounded-lg object-contain"
            />
          ) : (
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-3xl leading-tight text-white sm:text-5xl">
                {title}
              </h1>
              <div className="flex gap-3">
                <div className="h-24 flex-1 rounded-tile bg-chrome sm:h-28" />
                <div className="h-24 flex-1 rounded-tile bg-vote sm:h-28" />
                <div className="h-24 flex-1 rounded-tile bg-barrier sm:h-28" />
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-sm text-on-dark-soft">{title}</p>
            <span className="rounded-full bg-white px-3 py-2 text-[13px] font-black text-ink">
              ifXbuiltY
            </span>
          </div>
        </section>

        <section className="flex min-w-0 flex-1 flex-col gap-5">
          <div>
            <h1 className="font-display text-3xl leading-tight text-ink sm:text-[44px] sm:leading-snug">
              {title}
            </h1>
            <p className="mt-2 text-base leading-6 text-muted-foreground">
              {gen.tone ? `${gen.tone}. ` : ""}
              {blurb}
            </p>
          </div>

          <GenerationVoteBar
            generationId={gen.id}
            initialUp={gen.upvoteCount}
            initialDown={gen.downvoteCount}
          />
          <p className="text-sm text-muted">
            Net {formatCompactCount(netVotes)} (↑{" "}
            {formatCompactCount(gen.upvoteCount)} · ↓{" "}
            {formatCompactCount(gen.downvoteCount)})
          </p>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/remix/${gen.id}`}
              className="inline-flex min-w-[8rem] flex-1 items-center justify-center rounded-lg border-2 border-ink bg-chrome px-4 py-3.5 text-center text-base font-black text-ink hover:brightness-[0.98]"
            >
              Fork this
            </Link>
            {gen.imageUrl ? (
              <a
                href={gen.imageUrl}
                download
                className="inline-flex min-w-[8rem] flex-1 items-center justify-center rounded-lg bg-ink px-4 py-3.5 text-center text-base font-semibold text-white hover:bg-ink/90"
              >
                Download
              </a>
            ) : (
              <span className="inline-flex min-w-[8rem] flex-1 cursor-not-allowed items-center justify-center rounded-lg bg-ink/40 px-4 py-3.5 text-center text-base font-semibold text-white/80">
                Download
              </span>
            )}
          </div>

          <Surface variant="panel" className="flex flex-col gap-3 p-5">
            <MicroLabel>The ingredients</MicroLabel>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-canvas px-3 py-2 text-[13px] font-extrabold text-ink">
                Culprit: {gen.builder}
              </span>
              <span className="inline-flex rounded-full bg-canvas px-3 py-2 text-[13px] font-extrabold text-ink">
                Victim: {gen.target}
              </span>
              {gen.tone ? (
                <span className="inline-flex rounded-full bg-canvas px-3 py-2 text-[13px] font-extrabold text-ink">
                  Tone: {gen.tone}
                </span>
              ) : null}
              {gen.screenType ? (
                <span className="inline-flex rounded-full bg-canvas px-3 py-2 text-[13px] font-extrabold text-ink">
                  Screen: {gen.screenType}
                </span>
              ) : null}
            </div>
          </Surface>

          <Surface variant="composer" className="flex flex-col gap-3 border border-line-strong p-5">
            <MicroLabel>If it got weird</MicroLabel>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] text-muted-foreground">
                Flag this specimen
              </span>
              <span className="text-sm font-black text-barrier">Report via API</span>
            </div>
          </Surface>
        </section>
      </main>

      {others.length > 0 ? (
        <section className="border-t border-line px-4 py-10 sm:px-12">
          <h2 className="text-2xl font-black text-ink sm:text-[28px]">
            Related bad decisions
          </h2>
          <div className="mt-4 flex flex-wrap gap-4 lg:justify-between">
            {others.map((item, i) => (
              <FeedTile key={item.id} item={item} index={i + 1} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
