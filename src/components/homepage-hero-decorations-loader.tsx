"use client";

import dynamic from "next/dynamic";

import type { HeroFloatingThumb } from "@/lib/ui/types";

const HomepageHeroDecorations = dynamic(
  () =>
    import("@/components/homepage-hero-decorations").then(
      (mod) => mod.HomepageHeroDecorations,
    ),
  { ssr: false },
);

type HomepageHeroDecorationsLoaderProps = {
  thumbnails: HeroFloatingThumb[];
};

/** Client boundary for deferred hero thumbnails (required for `ssr: false` dynamic). */
export function HomepageHeroDecorationsLoader({
  thumbnails,
}: HomepageHeroDecorationsLoaderProps) {
  return <HomepageHeroDecorations thumbnails={thumbnails} />;
}
