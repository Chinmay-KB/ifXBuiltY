import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const CardShareAction = dynamic(
  () =>
    import("@/components/card-share-action").then((mod) => mod.CardShareAction),
  { ssr: false },
);
import { cn } from "@/lib/cn";
import { GENERATION_CARD_IMAGE_SIZES } from "@/lib/generation-image-sizes";
import { formatScreenBadge, getDisplayAspectClass } from "@/lib/screen-type";
import { generationImageUrl } from "@/lib/generation-media-url";
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
  /** Marks the likely LCP image as eager/high priority. */
  imagePriority?: boolean;
};

/**
 * GenerationCard — a visual card for the feed/masonry grid.
 *
 * - Image takes ≥70% of card height with object-fit cover
 * - Label: "{builder} built {target}" (truncated at 60 chars)
 * - Compact vote score
 * - Hover reveals CardActionBar on desktop (fade-in 200ms, fade-out 150ms)
 * - Card opens /g/[slug]; Download/Share stay clickable when the bar is visible
 * - Placeholder on image load failure
 */
export function GenerationCard({
  item,
  showActions = true,
  variant = "default",
  imagePriority = false,
}: GenerationCardProps) {
  const label = formatCardLabel(item.builder, item.target);
  const score = formatCompactCount(item.netScore);
  const paperTitle = `${item.builder} × ${item.target}`;
  const screenLabel =
    item.screenType && item.screenType.trim()
      ? formatScreenBadge(item.screenType)
      : "Screenshot";
  const imageAspectClass = getDisplayAspectClass(item.screenType ?? "desktop");
  const downloadHref = item.imagePath
    ? generationImageUrl(item.imagePath, "full")
    : null;

  if (variant === "paper") {
    return (
      <div className="group relative flex flex-col overflow-hidden break-inside-avoid rounded-2xl border border-line/80 bg-canvas shadow-[0_3px_14px_rgb(10_10_10/0.05)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_10px_24px_rgb(10_10_10/0.09)]">
        <Link
          href={`/g/${item.slug}`}
          className="absolute inset-0 z-0 rounded-2xl"
          aria-label={`Open ${label}`}
        />

        <div className="relative z-10 flex flex-col pointer-events-none">
          <div
            className={cn(
              "relative w-full overflow-hidden bg-panel",
              imageAspectClass,
            )}
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={label}
                fill
                sizes={GENERATION_CARD_IMAGE_SIZES}
                className="object-cover object-top transition-transform duration-300 ease-out motion-safe:group-hover:scale-[1.015]"
                loading={imagePriority ? "eager" : "lazy"}
                fetchPriority={imagePriority ? "high" : undefined}
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-ink to-ink/80 p-4">
                <p className="text-center font-display text-lg leading-tight text-white/80">
                  {label}
                </p>
              </div>
            )}

            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 backdrop-blur-md sm:bottom-3.5 sm:left-3.5 sm:gap-1.5 sm:px-2.5 sm:py-1.5">
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
              <span className="font-mono text-[9px] font-bold text-white sm:text-[11px]">{score}</span>
            </div>

            {showActions && (
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 hidden items-center justify-center gap-2 bg-linear-to-t from-ink/70 to-transparent px-3 py-3 transition-opacity lg:flex",
                  "pointer-events-none opacity-0 duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:duration-200 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:duration-200",
                )}
              >
                <CardAction
                  label="Download"
                  href={downloadHref ?? "#"}
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
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .799l6.733 3.366a2.5 2.5 0 11-.671 1.341l-6.733-3.366a2.5 2.5 0 110-3.482l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                    </svg>
                  }
                  slug={item.slug}
                  builder={item.builder}
                  target={item.target}
                  imageUrl={
                    item.imagePath
                      ? generationImageUrl(item.imagePath, "og")
                      : item.imageUrl
                  }
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 px-2.5 py-2.5 sm:px-3 sm:py-3">
            <p className="line-clamp-2 font-sans text-[13px] font-semibold leading-[1.14] tracking-[-0.01em] text-ink sm:text-[14px] md:font-display md:text-[17px] md:font-bold md:leading-[1.1] md:tracking-[-0.02em]">
              {paperTitle}
            </p>
            <p className="truncate font-mono text-[9px] uppercase tracking-wider text-subtle/80 sm:text-[10px]">
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
    <div className="group relative flex flex-col overflow-hidden break-inside-avoid rounded-tile bg-canvas shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Full-card hit target; content uses pointer-events-none so Download/Share stay usable */}
      <Link
        href={`/g/${item.slug}`}
        className="absolute inset-0 z-0 rounded-tile"
        aria-label={`Open ${label}`}
      />

      <div className="relative z-10 flex flex-col pointer-events-none">
        {/* Image area — ≥70% of card height */}
        <div
          className={cn(
            "relative w-full overflow-hidden bg-panel",
            imageAspectClass,
          )}
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={label}
              fill
              sizes={GENERATION_CARD_IMAGE_SIZES}
              className="object-cover object-top"
              loading={imagePriority ? "eager" : "lazy"}
              fetchPriority={imagePriority ? "high" : undefined}
              unoptimized
            />
          ) : (
            /* Placeholder on missing image URL */
            <div className="flex h-full w-full items-center justify-center bg-panel p-4">
              <p className="text-center font-display text-lg leading-tight text-muted">
                {label}
              </p>
            </div>
          )}

          {/* Desktop hover Action Bar */}
          {showActions && (
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 hidden items-center justify-center gap-2 bg-linear-to-t from-ink/60 to-transparent px-3 py-3 transition-opacity lg:flex",
                "pointer-events-none opacity-0 duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:duration-200 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:duration-200",
              )}
            >
              <CardAction
                label="Download"
                href={downloadHref ?? "#"}
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
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .799l6.733 3.366a2.5 2.5 0 11-.671 1.341l-6.733-3.366a2.5 2.5 0 110-3.482l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                  </svg>
                }
                slug={item.slug}
                builder={item.builder}
                target={item.target}
                imageUrl={
                    item.imagePath
                      ? generationImageUrl(item.imagePath, "og")
                      : item.imageUrl
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
  icon: ReactNode;
  href?: string;
  download?: boolean;
  slug?: string;
  builder?: string;
  target?: string;
  imageUrl?: string | null;
};

function CardAction({
  label,
  icon,
  href,
  download,
  slug,
  builder,
  target,
  imageUrl = null,
}: CardActionProps) {
  const classes =
    "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-transform duration-150 hover:scale-110";

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-label={label}
        download={download || undefined}
      >
        {icon}
      </Link>
    );
  }

  if (slug) {
    return (
      <CardShareAction
        label={label}
        slug={slug}
        builder={builder ?? ""}
        target={target ?? ""}
        imageUrl={imageUrl}
        icon={icon}
      />
    );
  }

  return null;
}
