"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

import { cn } from "@/lib/cn";
import { GENERATION_CARD_IMAGE_SIZES } from "@/lib/generation-image-sizes";
import { generationMediaPath } from "@/lib/generation-media-url";
import { formatCardLabel, formatCompactCount } from "@/lib/ui/format";
import type { FeedItem } from "@/lib/ui/types";

function formatRelativeShort(iso: string): string {
  const t = Date.now() - new Date(iso).getTime();
  const m = Math.floor(t / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

type GenerationCardProps = {
  item: FeedItem;
  /** Controls hover action bar visibility (desktop only) */
  showActions?: boolean;
  /** Paper feed card — tall frame, mono meta, vote chip */
  variant?: "default" | "paper";
};

/**
 * GenerationCard — a visual card for the feed/masonry grid.
 *
 * - Image takes ≥70% of card height with object-fit cover
 * - Label: "{builder} built {target}" (truncated at 60 chars)
 * - Compact vote score
 * - Hover reveals CardActionBar on desktop (fade-in 200ms, fade-out 150ms)
 * - Card opens /g/[slug]; Remix/Download/Share stay clickable when the bar is visible
 * - Remix count badge when remixCount >= 1
 * - Placeholder on image load failure
 */
export function GenerationCard({
  item,
  showActions = true,
  variant = "default",
}: GenerationCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const label = formatCardLabel(item.builder, item.target);
  const score = formatCompactCount(item.netScore);
  const paperTitle = `${item.builder} × ${item.target}`;
  const toneLabel =
    (item.vibeTags && item.vibeTags.length > 0 ? item.vibeTags[0] : null) ||
    (item.tone && item.tone.trim()) ||
    "Wild";
  const screenLabel = (item.screenType && item.screenType.trim()) || "Screenshot";

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  if (variant === "paper") {
    return (
      <div
        className="group relative flex flex-col overflow-hidden break-inside-avoid rounded-2xl bg-canvas"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link
          href={`/g/${item.slug}`}
          className="absolute inset-0 z-0 rounded-2xl"
          aria-label={`Open ${label}`}
        />

        <div className="relative z-10 flex flex-col pointer-events-none">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink">
            {item.imageUrl && !imageError ? (
              <Image
                src={item.imageUrl}
                alt={label}
                fill
                sizes={GENERATION_CARD_IMAGE_SIZES}
                className="object-cover"
                loading="lazy"
                onError={handleImageError}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink to-ink/80 p-4">
                <p className="text-center font-display text-lg leading-tight text-white/80">
                  {label}
                </p>
              </div>
            )}

            <span className="absolute left-3.5 top-3.5 rounded-full bg-chrome px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink">
              {toneLabel}
            </span>

            <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 backdrop-blur-md">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 20V4M5 11l7-7 7 7" />
              </svg>
              <span className="font-mono text-[11px] font-bold text-white">{score}</span>
            </div>

            {showActions && (
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 hidden items-center justify-center gap-2 bg-gradient-to-t from-ink/70 to-transparent px-3 py-3 transition-opacity lg:flex",
                  isHovered
                    ? "pointer-events-auto opacity-100 duration-200"
                    : "pointer-events-none opacity-0 duration-150",
                )}
              >
                <CardAction
                  label="Remix"
                  href={`/remix/${item.id}`}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                    </svg>
                  }
                />
                <CardAction
                  label="Download"
                  href={
                    item.imageUrl ? generationMediaPath(item.slug, "full") : "#"
                  }
                  download
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                  }
                />
                <CardAction
                  label="Share"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: label,
                        url: `/g/${item.slug}`,
                      });
                    } else {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/g/${item.slug}`,
                      );
                    }
                  }}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .799l6.733 3.366a2.5 2.5 0 11-.671 1.341l-6.733-3.366a2.5 2.5 0 110-3.482l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                    </svg>
                  }
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-0.5 px-1 py-3">
            <p className="font-display text-[17px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
              {paperTitle}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
              <span suppressHydrationWarning>
                {screenLabel} · {formatRelativeShort(item.createdAt)}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden break-inside-avoid rounded-[7px] bg-canvas shadow-sm transition-all duration-200 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Full-card hit target; content uses pointer-events-none so Remix/Download/Share stay usable */}
      <Link
        href={`/g/${item.slug}`}
        className="absolute inset-0 z-0 rounded-[7px]"
        aria-label={`Open ${label}`}
      />

      <div className="relative z-10 flex flex-col pointer-events-none">
        {/* Image area — ≥70% of card height */}
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          {item.imageUrl && !imageError ? (
            <Image
              src={item.imageUrl}
              alt={label}
              fill
              sizes={GENERATION_CARD_IMAGE_SIZES}
              className="object-cover"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            /* Placeholder on image failure or missing URL */
            <div className="flex h-full w-full items-center justify-center bg-panel p-4">
              <p className="text-center font-display text-lg leading-tight text-muted">
                {label}
              </p>
            </div>
          )}

          {/* Remix count badge */}
          {item.remixCount >= 1 && (
            <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-medium text-white">
              {item.remixCount} {item.remixCount === 1 ? "remix" : "remixes"}
            </span>
          )}

          {/* Desktop hover Action Bar */}
          {showActions && (
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 hidden items-center justify-center gap-2 bg-gradient-to-t from-ink/60 to-transparent px-3 py-3 transition-opacity lg:flex",
                isHovered
                  ? "pointer-events-auto opacity-100 duration-200"
                  : "pointer-events-none opacity-0 duration-150",
              )}
            >
              <CardAction
                label="Remix"
                href={`/remix/${item.id}`}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                  </svg>
                }
              />
              <CardAction
                label="Download"
                href={
                  item.imageUrl ? generationMediaPath(item.slug, "full") : "#"
                }
                download
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                }
              />
              <CardAction
                label="Share"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: label,
                      url: `/g/${item.slug}`,
                    });
                  } else {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/g/${item.slug}`,
                    );
                  }
                }}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .799l6.733 3.366a2.5 2.5 0 11-.671 1.341l-6.733-3.366a2.5 2.5 0 110-3.482l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                  </svg>
                }
              />
            </div>
          )}
        </div>

        {/* Card footer: label + vote score */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
            {label}
          </p>
          <span className="shrink-0 text-xs font-semibold text-muted">
            ↑ {score}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Internal CardAction button/link ─── */

type CardActionProps = {
  label: string;
  icon: React.ReactNode;
  href?: string;
  download?: boolean;
  onClick?: () => void;
};

function CardAction({ label, icon, href, download, onClick }: CardActionProps) {
  const classes =
    "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-transform duration-150 hover:scale-110";

  if (href && !onClick) {
    return (
      <Link
        href={href}
        className={classes}
        aria-label={label}
        download={download || undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {icon}
    </button>
  );
}
