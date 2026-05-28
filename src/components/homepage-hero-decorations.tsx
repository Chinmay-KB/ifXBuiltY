"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { HeroFloatingThumb } from "@/lib/ui/types";

type HomepageHeroDecorationsProps = {
  thumbnails: HeroFloatingThumb[];
};

export function HomepageHeroDecorations({
  thumbnails,
}: HomepageHeroDecorationsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Decorative only — let the main content paint first.
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      setMounted(true);
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const t = setTimeout(start, 900);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  const desktopThumbs = thumbnails.slice(0, 8);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {desktopThumbs.map((thumb, i) => (
          <FloatingThumbnail
            key={thumb.id}
            thumb={thumb}
            index={i}
            mounted={mounted}
            positions={DESKTOP_POSITIONS}
          />
        ))}
      </div>

      <div className="relative z-10 mb-6 flex items-center gap-3 md:hidden">
        {thumbnails.slice(0, 3).map((thumb, i) => (
          <Link
            key={thumb.id}
            href={`/g/${thumb.slug}`}
            className="relative block h-[72px] w-[56px] overflow-hidden rounded-lg border border-line bg-panel shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
            style={{
              transform: `rotate(${MOBILE_ROTATIONS[i % MOBILE_ROTATIONS.length]}deg)`,
            }}
          >
            {thumb.imageUrl && (
              <Image
                src={thumb.imageUrl}
                alt={`${thumb.builder} × ${thumb.target}`}
                fill
                sizes="56px"
                className="object-cover"
                priority={i === 0}
                unoptimized
              />
            )}
          </Link>
        ))}
      </div>
    </>
  );
}

type ThumbPosition = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: number;
  w: number;
  h: number;
  opacity: number;
  floatY: number;
  floatDuration: number;
};

const DESKTOP_POSITIONS: ThumbPosition[] = [
  { top: "8%", left: "3%", rotate: -4, w: 140, h: 180, opacity: 0.9, floatY: -6, floatDuration: 5.2 },
  { top: "25%", left: "13%", rotate: 3, w: 120, h: 155, opacity: 0.85, floatY: -5, floatDuration: 4.8 },
  { bottom: "22%", left: "4%", rotate: 5, w: 130, h: 110, opacity: 0.88, floatY: -7, floatDuration: 5.5 },
  { bottom: "6%", left: "16%", rotate: -2, w: 110, h: 140, opacity: 0.8, floatY: -4, floatDuration: 4.5 },
  { top: "5%", right: "3%", rotate: 3, w: 155, h: 195, opacity: 0.9, floatY: -6, floatDuration: 5.0 },
  { top: "26%", right: "15%", rotate: -4, w: 125, h: 160, opacity: 0.85, floatY: -5, floatDuration: 5.3 },
  { bottom: "18%", right: "4%", rotate: -3, w: 135, h: 170, opacity: 0.88, floatY: -7, floatDuration: 4.7 },
  { bottom: "5%", right: "17%", rotate: 5, w: 115, h: 100, opacity: 0.8, floatY: -4, floatDuration: 5.6 },
  { top: "32%", left: "27%", rotate: -6, w: 95, h: 125, opacity: 0.35, floatY: -3, floatDuration: 6.0 },
  { top: "28%", right: "25%", rotate: 5, w: 90, h: 115, opacity: 0.3, floatY: -3, floatDuration: 6.2 },
  { top: "4%", left: "30%", rotate: 7, w: 75, h: 95, opacity: 0.45, floatY: -4, floatDuration: 5.8 },
  { top: "6%", right: "28%", rotate: -5, w: 70, h: 90, opacity: 0.4, floatY: -3, floatDuration: 6.1 },
  { top: "45%", left: "-1%", rotate: 2, w: 90, h: 120, opacity: 0.7, floatY: -5, floatDuration: 5.4 },
  { top: "42%", right: "-1%", rotate: -2, w: 85, h: 115, opacity: 0.65, floatY: -4, floatDuration: 5.1 },
  { bottom: "10%", left: "36%", rotate: 3, w: 80, h: 65, opacity: 0.3, floatY: -3, floatDuration: 6.3 },
];

const MOBILE_ROTATIONS = [-4, 3, -2, 5, -3];

function FloatingThumbnail({
  thumb,
  index,
  mounted,
  positions,
}: {
  thumb: HeroFloatingThumb;
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

  const animationStyle: React.CSSProperties = {
    "--float-base": `rotate(${pos.rotate}deg)`,
    "--float-y": `${pos.floatY}px`,
    "--float-duration": `${pos.floatDuration}s`,
    "--float-delay": `${index * 0.4}s`,
    transform: mounted
      ? `rotate(${pos.rotate}deg) scale(1)`
      : `rotate(${pos.rotate}deg) scale(0.98)`,
    opacity: pos.opacity,
    transition: mounted
      ? `transform 800ms cubic-bezier(0.22, 1, 0.36, 1)`
      : undefined,
    transitionDelay: mounted ? `${index * 80 + 150}ms` : undefined,
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
          loading="lazy"
          priority={false}
          unoptimized
        />
      ) : (
        <div className="h-full w-full bg-panel" />
      )}
    </Link>
  );
}
