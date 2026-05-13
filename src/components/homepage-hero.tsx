"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";

type FloatingThumb = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  imageUrl: string;
};

type HomepageHeroProps = {
  thumbnails: FloatingThumb[];
  ideasThisWeek: number;
  totalPublished: number;
};

/**
 * Behance-style hero: centered headline with floating generation thumbnails
 * scattered around it. Thumbnails animate in with staggered delays, then
 * gently float. Hovering scales them up; clicking navigates to the generation.
 */
export function HomepageHero({ thumbnails, ideasThisWeek, totalPublished }: HomepageHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay so the entrance animation is visible after hydration
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative flex flex-col items-center">
      {/* Hero area with floating thumbnails */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden px-5 pb-10 pt-12 md:min-h-[600px] md:px-12 md:pb-14 md:pt-16">
        {/* Floating thumbnails — desktop */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {thumbnails.slice(0, DESKTOP_POSITIONS.length).map((thumb, i) => (
            <FloatingThumbnail
              key={thumb.id}
              thumb={thumb}
              index={i}
              mounted={mounted}
              positions={DESKTOP_POSITIONS}
            />
          ))}
        </div>

        {/* Mobile thumbnail strip — smaller, fewer */}
        <div className="mb-6 flex items-center gap-3 md:hidden">
          {thumbnails.slice(0, 5).map((thumb, i) => (
            <Link
              key={thumb.id}
              href={`/g/${thumb.slug}`}
              className={cn(
                "relative block h-[72px] w-[56px] overflow-hidden rounded-lg border border-line bg-panel shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-700",
                mounted
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0",
              )}
              style={{
                transitionDelay: `${i * 100 + 100}ms`,
                transform: mounted
                  ? `rotate(${MOBILE_ROTATIONS[i % MOBILE_ROTATIONS.length]}deg)`
                  : undefined,
              }}
            >
              {thumb.imageUrl && (
                <Image
                  src={thumb.imageUrl}
                  alt={`${thumb.builder} × ${thumb.target}`}
                  fill
                  sizes="56px"
                  className="object-cover"
                  loading="eager"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Center content */}
        <div className="relative z-10 flex max-w-[680px] flex-col items-center gap-5">
          <h1
            className={cn(
              "text-center font-display text-[clamp(2.75rem,10vw,5rem)] font-black italic leading-[0.88] tracking-[-0.04em] text-ink transition-all duration-700",
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0",
            )}
            style={{ transitionDelay: "100ms" }}
          >
            The world&apos;s worst product ideas.
          </h1>
          <p
            className={cn(
              "max-w-[480px] text-center text-[15px] leading-relaxed text-muted-foreground transition-all duration-700 md:text-lg",
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: "250ms" }}
          >
            Crossbreed any company with any product. Watch the UI write itself.
            One prompt, one cursed screenshot from a parallel universe.
          </p>
          <div
            className={cn(
              "flex flex-col items-center gap-3 pt-2 transition-all duration-700 sm:flex-row",
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: "400ms" }}
          >
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-display text-base font-black italic text-chrome transition-all duration-200 hover:scale-[1.03] hover:opacity-90 active:scale-[0.97]"
            >
              Cook one up
              <span className="text-chrome">→</span>
            </Link>
            <a
              href="#feed"
              className="inline-flex items-center rounded-full border-[1.5px] border-line-strong px-5 py-[14px] text-sm font-medium text-muted transition-all duration-200 hover:border-ink hover:text-ink active:scale-[0.97]"
            >
              Browse the evidence
            </a>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div
        className={cn(
          "flex w-full items-center justify-center gap-5 border-b border-line bg-panel/50 px-5 py-3 transition-all duration-700 md:gap-8 md:py-3.5",
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
        style={{ transitionDelay: "550ms" }}
      >
        {ideasThisWeek > 0 && (
          <>
            <StatItem value={String(ideasThisWeek)} label="ideas this week" />
            <div className="h-4 w-px bg-line" />
          </>
        )}
        {totalPublished >= 100 && (
          <>
            <StatItem
              value={formatCompact(totalPublished)}
              label="designers cooking"
            />
            <div className="h-4 w-px bg-line" />
          </>
        )}
        <StatItem value="∞" label="bad taste generated" />
      </div>
    </section>
  );
}

/* ─── Thumbnail Positions ─── */

type ThumbPosition = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: number;
  w: number;
  h: number;
  opacity: number;
  /** Float bob amplitude in px */
  floatY: number;
  /** Float duration in seconds */
  floatDuration: number;
};

const DESKTOP_POSITIONS: ThumbPosition[] = [
  // Left cluster — prominent
  { top: "8%", left: "3%", rotate: -4, w: 140, h: 180, opacity: 0.9, floatY: -6, floatDuration: 5.2 },
  { top: "25%", left: "13%", rotate: 3, w: 120, h: 155, opacity: 0.85, floatY: -5, floatDuration: 4.8 },
  { bottom: "22%", left: "4%", rotate: 5, w: 130, h: 110, opacity: 0.88, floatY: -7, floatDuration: 5.5 },
  { bottom: "6%", left: "16%", rotate: -2, w: 110, h: 140, opacity: 0.8, floatY: -4, floatDuration: 4.5 },
  // Right cluster — prominent
  { top: "5%", right: "3%", rotate: 3, w: 155, h: 195, opacity: 0.9, floatY: -6, floatDuration: 5.0 },
  { top: "26%", right: "15%", rotate: -4, w: 125, h: 160, opacity: 0.85, floatY: -5, floatDuration: 5.3 },
  { bottom: "18%", right: "4%", rotate: -3, w: 135, h: 170, opacity: 0.88, floatY: -7, floatDuration: 4.7 },
  { bottom: "5%", right: "17%", rotate: 5, w: 115, h: 100, opacity: 0.8, floatY: -4, floatDuration: 5.6 },
  // Mid-zone — faded, behind text for depth
  { top: "32%", left: "27%", rotate: -6, w: 95, h: 125, opacity: 0.35, floatY: -3, floatDuration: 6.0 },
  { top: "28%", right: "25%", rotate: 5, w: 90, h: 115, opacity: 0.3, floatY: -3, floatDuration: 6.2 },
  // Top center — small, subtle
  { top: "4%", left: "30%", rotate: 7, w: 75, h: 95, opacity: 0.45, floatY: -4, floatDuration: 5.8 },
  { top: "6%", right: "28%", rotate: -5, w: 70, h: 90, opacity: 0.4, floatY: -3, floatDuration: 6.1 },
  // Edge peekers
  { top: "45%", left: "-1%", rotate: 2, w: 90, h: 120, opacity: 0.7, floatY: -5, floatDuration: 5.4 },
  { top: "42%", right: "-1%", rotate: -2, w: 85, h: 115, opacity: 0.65, floatY: -4, floatDuration: 5.1 },
  // Bottom center
  { bottom: "10%", left: "36%", rotate: 3, w: 80, h: 65, opacity: 0.3, floatY: -3, floatDuration: 6.3 },
];

const MOBILE_ROTATIONS = [-4, 3, -2, 5, -3];

/* ─── Floating Thumbnail Component ─── */

function FloatingThumbnail({
  thumb,
  index,
  mounted,
  positions,
}: {
  thumb: FloatingThumb;
  index: number;
  mounted: boolean;
  positions: ThumbPosition[];
}) {
  const pos = positions[index % positions.length]!;

  const positionStyle: React.CSSProperties = {
    position: "absolute",
    width: pos.w,
    height: pos.h,
    ...(pos.top ? { top: pos.top } : {}),
    ...(pos.bottom ? { bottom: pos.bottom } : {}),
    ...(pos.left ? { left: pos.left } : {}),
    ...(pos.right ? { right: pos.right } : {}),
  };

  // The float animation uses a CSS custom property for the base transform
  const animationStyle: React.CSSProperties = {
    "--float-base": `rotate(${pos.rotate}deg)`,
    "--float-y": `${pos.floatY}px`,
    "--float-duration": `${pos.floatDuration}s`,
    "--float-delay": `${index * 0.4}s`,
    transform: mounted
      ? `rotate(${pos.rotate}deg) scale(1)`
      : `rotate(${pos.rotate}deg) scale(0.8)`,
    opacity: mounted ? pos.opacity : 0,
    transition: `transform 800ms cubic-bezier(0.22, 1, 0.36, 1), opacity 800ms cubic-bezier(0.22, 1, 0.36, 1)`,
    transitionDelay: `${index * 80 + 150}ms`,
  } as React.CSSProperties;

  return (
    <Link
      href={`/g/${thumb.slug}`}
      className={cn(
        "pointer-events-auto block overflow-hidden rounded-xl border border-line shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow duration-250",
        mounted && "hero-thumb-float",
        "hover:z-50 hover:scale-[1.08] hover:rotate-0 hover:shadow-[0_16px_50px_rgba(0,0,0,0.2)] hover:opacity-100",
      )}
      style={{ ...positionStyle, ...animationStyle }}
      aria-label={`${thumb.builder} × ${thumb.target}`}
      tabIndex={-1}
    >
      {thumb.imageUrl ? (
        <Image
          src={thumb.imageUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 0px, 200px"
          className="object-cover transition-transform duration-300 hover:scale-105"
          loading="eager"
        />
      ) : (
        <div className="h-full w-full bg-panel" />
      )}
    </Link>
  );
}

/* ─── Stat Item ─── */

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-sans text-lg font-extrabold text-ink md:text-xl">
        {value}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted md:text-[10px]">
        {label}
      </span>
    </div>
  );
}

/* ─── Helpers ─── */

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
