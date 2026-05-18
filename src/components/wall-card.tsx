"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { WALL_CARD_IMAGE_SIZES } from "@/lib/generation-image-sizes";

export type WallItem = {
  id: number | string;
  slug: string;
  imageUrl: string | null;
  builder: string;
  target: string;
};

type WallCardProps = {
  item: WallItem;
  height: number;
  eager?: boolean;
  /** Slight random rotation for visual chaos */
  tilt?: number;
};

/**
 * Minimal image-only card for the homepage wall.
 * Fixed height, width = height × 1.5, object-fit cover.
 * Slight tilt for visual interest. Hover scales + removes tilt.
 */
export function WallCard({ item, height, eager = false, tilt = 0 }: WallCardProps) {
  const [imgError, setImgError] = useState(false);
  const width = Math.round(height * 1.5);

  return (
    <Link
      href={`/g/${item.slug}`}
      className="group relative block flex-shrink-0 overflow-hidden rounded-xl shadow-md transition-all duration-200 ease hover:z-10 hover:scale-105 hover:rotate-0 hover:shadow-xl"
      style={{
        width,
        height,
        transform: `rotate(${tilt}deg)`,
      }}
      aria-label={`if ${item.builder} built ${item.target}`}
    >
      {!imgError && item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={`if ${item.builder} built ${item.target}`}
          fill
          sizes={WALL_CARD_IMAGE_SIZES(width)}
          className="object-cover"
          loading={eager ? "eager" : "lazy"}
          priority={eager}
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-chrome/20 via-panel to-ink/10"
          aria-hidden="true"
        >
          <span className="px-3 text-center text-xs font-bold text-ink/40">
            {item.builder} × {item.target}
          </span>
        </div>
      )}

      {/* Hover: builder × target with bottom gradient for legibility (image cards only) */}
      {!imgError && item.imageUrl ? (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-end opacity-0 transition-opacity duration-200 ease group-hover:opacity-100"
          aria-hidden="true"
        >
          <div className="wall-card-hover-scrim px-3 pb-3 pt-[min(5.5rem,42%)]">
            <p className="line-clamp-2 text-center text-[11px] font-semibold leading-snug tracking-tight text-on-dark-soft [text-shadow:0_1px_2px_rgb(0_0_0/0.55),0_2px_12px_rgb(0_0_0/0.35)] sm:text-xs">
              <span>{item.builder}</span>
              <span className="mx-1 font-normal text-on-dark-muted">×</span>
              <span>{item.target}</span>
            </p>
          </div>
        </div>
      ) : null}
    </Link>
  );
}
