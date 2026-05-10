"use client";

import Zoom from "@/components/image-zoom";

import { ImageOverlayActions } from "./image-overlay-actions";

type Props = {
  imageUrl: string;
  title: string;
  generationId: number;
  slug: string;
  imageDownloadUrl: string | null;
};

export function PublishedGenerationHero({
  imageUrl,
  title,
  generationId,
  slug,
  imageDownloadUrl,
}: Props) {
  return (
    <section className="relative mx-auto w-full max-w-[600px]">
      <div className="relative overflow-hidden rounded-lg">
        <Zoom>
          {/* eslint-disable-next-line @next/next/no-img-element -- rmiz measures native <img>; Next/Image breaks zoom geometry */}
          <img
            src={imageUrl}
            alt={title}
            width={1024}
            height={1024}
            sizes="(max-width: 768px) 100vw, 600px"
            className="h-auto w-full max-h-[600px] object-contain"
            fetchPriority="high"
            decoding="async"
          />
        </Zoom>
        <ImageOverlayActions
          generationId={generationId}
          slug={slug}
          title={title}
          imageDownloadUrl={imageDownloadUrl}
        />
      </div>
    </section>
  );
}
