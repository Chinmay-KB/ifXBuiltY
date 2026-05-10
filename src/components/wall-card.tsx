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
      className="relative block flex-shrink-0 overflow-hidden rounded-xl shadow-md transition-all duration-200 hover:z-10 hover:scale-105 hover:rotate-0 hover:shadow-xl"
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
    </Link>
  );
}
