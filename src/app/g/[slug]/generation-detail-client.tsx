"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { GenerationCard } from "@/components/generation-card";
import { VoteControls } from "@/components/vote-controls";
import { generationMediaPath } from "@/lib/generation-media-url";
import { clearActiveGenerationId } from "@/lib/generation/active-generation-storage";
import type { GenerationStatus } from "@/lib/generation/types";
import { isGenerationInProgress } from "@/lib/generation/types";
import { useGenerationStatus } from "@/hooks/use-generation-status";
import type { PublicGeneration } from "@/lib/public-generation";
import { formatScreenLabel } from "@/lib/screen-type";
import { formatResultTitle } from "@/lib/ui/format";
import type { FeedItem } from "@/lib/ui/types";

import { GenerationDetailActions } from "./generation-detail-actions";
import { PromptNoteCollapsible } from "./prompt-note-collapsible";
import { PublishedGenerationHero } from "./published-generation-hero";

type GenerationDetailClientProps = {
  initial: PublicGeneration;
  related: FeedItem[];
};

function statusLabel(status: GenerationStatus): string {
  if (status === "queued") return "Queued";
  if (status === "processing") return "Rendering";
  if (status === "failed") return "Failed";
  return "Published specimen";
}

export function GenerationDetailClient({
  initial,
  related,
}: GenerationDetailClientProps) {
  const router = useRouter();
  const inProgress = isGenerationInProgress(initial.status);

  const onCompleted = useCallback(() => {
    clearActiveGenerationId();
    router.refresh();
  }, [router]);

  const onFailed = useCallback(() => {
    clearActiveGenerationId();
  }, []);

  const { data: statusData, error: statusError } = useGenerationStatus({
    generationId: initial.id,
    initial: inProgress
      ? {
          id: initial.id,
          slug: initial.slug,
          status: initial.status,
          builder: initial.builder,
          target: initial.target,
          errorMessage: initial.errorMessage,
          imageUrl: initial.imageUrl,
        }
      : null,
    enabled: inProgress && initial.isOwner,
    onCompleted,
    onFailed,
  });

  const gen: PublicGeneration = statusData
    ? {
        ...initial,
        status: statusData.status,
        errorMessage: statusData.errorMessage,
        imageUrl: statusData.imageUrl ?? initial.imageUrl,
        imageDownloadUrl:
          statusData.status === "completed"
            ? generationMediaPath(statusData.slug, "full")
            : initial.imageDownloadUrl,
      }
    : initial;

  const title = formatResultTitle(gen.builder, gen.target);
  const netScore = gen.upvoteCount - gen.downvoteCount;
  const tone = gen.tone?.trim();
  const screenType =
    gen.screenType?.trim()
      ? formatScreenLabel(gen.screenType)
      : "UI screenshot";
  const pending = isGenerationInProgress(gen.status);
  const failed = gen.status === "failed";
  const imageUnavailable =
    gen.status === "completed" && !gen.imageUrl;

  const creatorName =
    gen.creator?.displayName?.trim() ||
    (gen.isOwner ? "You" : null);
  const creatorAvatarUrl = gen.creator?.avatarUrl?.trim() || null;
  const creatorInitial =
    creatorName?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <div className="flex flex-col bg-canvas pb-12">
      <div className="flex items-center gap-2 px-5 pt-4 font-mono text-[10px] uppercase tracking-[0.06em] text-muted sm:px-6 sm:pt-5 sm:text-[11px] lg:px-14">
        <Link href="/feed" className="transition-colors hover:text-ink">
          Back to feed
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink">
          {gen.builder} × {gen.target}
        </span>
      </div>

      <div className="mt-4 grid gap-7 px-5 sm:mt-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-12 lg:px-14">
        <div className="min-w-0 flex-1">
          {pending ? (
            <section
              className="relative flex min-h-[320px] w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-line bg-panel p-8"
              role="status"
              aria-live="polite"
            >
              <span className="size-3 animate-pulse rounded-full bg-chrome" />
              <p className="text-center font-display text-2xl font-black text-ink">
                Rendering your mockup…
              </p>
              <p className="max-w-md text-center text-sm text-muted">
                You can leave this page — we&apos;ll keep working and update when
                it&apos;s ready.
              </p>
            </section>
          ) : failed ? (
            <section className="relative flex min-h-[320px] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-barrier/30 bg-panel p-8">
              <p className="font-display text-2xl font-black text-barrier">
                Generation failed
              </p>
              <p className="max-w-md text-center text-sm text-muted">
                {gen.errorMessage || statusError || "Something went wrong."}
              </p>
              <Link
                href="/generate"
                className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-chrome"
              >
                Try again
              </Link>
            </section>
          ) : imageUnavailable ? (
            <section className="relative flex min-h-[320px] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-barrier/30 bg-panel p-8">
              <p className="font-display text-2xl font-black text-barrier">
                Image unavailable
              </p>
              <p className="max-w-md text-center text-sm text-muted">
                This mockup is no longer in storage. It won&apos;t appear in the public
                feed.
              </p>
              {gen.isOwner ? (
                <Link
                  href={`/remix/${gen.id}`}
                  className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-chrome"
                >
                  Regenerate
                </Link>
              ) : null}
            </section>
          ) : gen.imageUrl ? (
            <PublishedGenerationHero
              imageUrl={gen.imageUrl}
              title={title}
              screenType={gen.screenType}
              variant="paper"
            />
          ) : (
            <section className="relative flex min-h-[320px] w-full items-center justify-center overflow-hidden rounded-3xl bg-panel">
              <p className="font-display text-2xl text-muted">{title}</p>
            </section>
          )}
        </div>

        <aside className="flex w-full min-w-0 shrink-0 flex-col gap-5 overflow-x-hidden sm:gap-6 lg:sticky lg:top-28 lg:self-start">
          <div className="border-b border-line pb-4 sm:pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  failed || imageUnavailable
                    ? "rounded-full bg-barrier/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-barrier"
                    : pending
                      ? "rounded-full bg-chrome/30 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink"
                      : "rounded-full bg-chrome px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink"
                }
              >
                {imageUnavailable ? "Unavailable" : statusLabel(gen.status)}
              </span>
              <span className="rounded-full bg-panel px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                {screenType}
              </span>
            </div>
            <h1 className="mt-2 font-display text-[clamp(2.15rem,10vw,3rem)] font-black leading-[0.9] tracking-[-0.04em] text-ink">
              If {gen.builder}
              <br />
              built {gen.target}.
            </h1>
            {tone ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                <span>{tone}</span>
              </div>
            ) : null}

            {creatorName ? (
              <Link
                href={gen.creator?.id ? `/u/${gen.creator.id}` : "#"}
                className="mt-4 inline-flex items-center gap-2 text-xs text-muted transition-colors hover:text-ink"
                aria-label={`Open ${creatorName} profile`}
                prefetch={false}
              >
                {creatorAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creatorAvatarUrl}
                    alt=""
                    className="size-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-full bg-panel text-[11px] font-semibold text-ink">
                    {creatorInitial}
                  </div>
                )}
                <span>
                  Generated by{" "}
                  <span className="font-semibold text-ink">{creatorName}</span>
                </span>
              </Link>
            ) : null}
          </div>

          {!pending && !failed && !imageUnavailable ? (
            <>
              <div>
                <GenerationDetailActions
                  slug={gen.slug}
                  title={title}
                  imageDownloadUrl={gen.imageDownloadUrl ?? null}
                />
              </div>

              <div>
                <VoteControls
                  generationId={gen.id}
                  initialScore={netScore}
                  initialUserVote={gen.userVote}
                  compact={false}
                />
              </div>
            </>
          ) : null}

          {gen.extraDetails ? (
            <PromptNoteCollapsible content={gen.extraDetails} />
          ) : null}
        </aside>
      </div>

      {!pending && !failed && !imageUnavailable && related.length > 0 ? (
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
      ) : null}
    </div>
  );
}
