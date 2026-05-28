"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { HeroFloatingThumb } from "@/lib/ui/types";

const REVEAL_SAFETY_MS = 2500;

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
          <MobileFloatingThumbnail key={thumb.id} thumb={thumb} index={i} />
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

function useImageReveal(hasImage: boolean) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!hasImage) return;

    const t = setTimeout(() => setTimedOut(true), REVEAL_SAFETY_MS);
    return () => clearTimeout(t);
  }, [hasImage]);

  return {
    onLoad: () => setLoaded(true),
    revealed: !hasImage || loaded || timedOut,
  };
}

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
  const hasImage = Boolean(thumb.imageUrl);
  const { onLoad, revealed: imageReady } = useImageReveal(hasImage);
  const revealed = mounted && imageReady;

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    width: pos.w,
    height: pos.h,
    ...(pos.top ? { top: pos.top } : {}),
    ...(pos.bottom ? { bottom: pos.bottom } : {}),
    ...(pos.left ? { left: pos.left } : {}),
    ...(pos.right ? { right: pos.right } : {}),
    "--reveal-opacity": pos.opacity,
    "--reveal-delay": `${index * 70 + 120}ms`,
  } as React.CSSProperties;

  const floatStyle: React.CSSProperties = {
    "--float-base": `rotate(${pos.rotate}deg)`,
    "--float-y": `${pos.floatY}px`,
    "--float-duration": `${pos.floatDuration}s`,
    "--float-delay": `${index * 0.4}s`,
  } as React.CSSProperties;

  return (
    <div
      className="hero-thumb-reveal pointer-events-none"
      style={wrapperStyle}
      data-revealed={revealed ? "true" : "false"}
    >
      <Link
        href={`/g/${thumb.slug}`}
        className={cn(
          "pointer-events-auto relative block h-full w-full overflow-hidden rounded-xl border border-line bg-panel shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow duration-250",
          revealed && "hero-thumb-float",
          "hover:z-50 hover:scale-[1.08] hover:rotate-0 hover:shadow-[0_16px_50px_rgba(0,0,0,0.2)] hover:opacity-100",
        )}
        style={floatStyle}
        aria-label={`${thumb.builder} × ${thumb.target}`}
        tabIndex={-1}
      >
        {hasImage ? (
          <Image
            src={thumb.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 0px, 200px"
            className="object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            priority={false}
            unoptimized
            onLoad={onLoad}
          />
        ) : (
          <div className="h-full w-full bg-panel" />
        )}
      </Link>
    </div>
  );
}

function MobileFloatingThumbnail({
  thumb,
  index,
}: {
  thumb: HeroFloatingThumb;
  index: number;
}) {
  const hasImage = Boolean(thumb.imageUrl);
  const { onLoad, revealed } = useImageReveal(hasImage);
  const rotation = MOBILE_ROTATIONS[index % MOBILE_ROTATIONS.length]!;

  return (
    <Link
      href={`/g/${thumb.slug}`}
      className={cn(
        "hero-thumb-mobile-reveal relative block h-[72px] w-[56px] overflow-hidden rounded-lg border border-line bg-panel shadow-[0_4px_16px_rgba(0,0,0,0.1)]",
      )}
      style={
        {
          transform: `rotate(${rotation}deg)`,
          "--reveal-delay": `${index * 60 + 80}ms`,
        } as React.CSSProperties
      }
      data-revealed={revealed ? "true" : "false"}
    >
      {hasImage && (
        <Image
          src={thumb.imageUrl}
          alt={`${thumb.builder} × ${thumb.target}`}
          fill
          sizes="56px"
          className="object-cover"
          priority={index === 0}
          unoptimized
          onLoad={onLoad}
        />
      )}
    </Link>
  );
}
