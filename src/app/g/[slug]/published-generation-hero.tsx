"use client";

import Zoom from "@/components/image-zoom";

import { ImageOverlayActions } from "./image-overlay-actions";

type Props = {
  imageUrl: string;
  title: string;
  generationId: number;
  slug: string;
  imageDownloadUrl: string | null;
  variant?: "default" | "paper";
};

export function PublishedGenerationHero({
  imageUrl,
  title,
  generationId,
  slug,
  imageDownloadUrl,
  variant = "default",
}: Props) {
  const frame =
    variant === "paper"
      ? "relative mx-auto w-full overflow-hidden rounded-3xl bg-gradient-to-br from-panel to-canvas"
      : "relative mx-auto w-full max-w-[600px] overflow-hidden rounded-lg";

  return (
    <section className={frame}>
      <div className="relative">
        <Zoom>
          {/* eslint-disable-next-line @next/next/no-img-element -- rmiz measures native <img>; Next/Image breaks zoom geometry */}
          <img
            src={imageUrl}
            alt={title}
            width={1024}
            height={1024}
            sizes={variant === "paper" ? "(max-width: 1024px) 100vw, 65vw" : "(max-width: 768px) 100vw, 600px"}
            className={
              variant === "paper"
                ? "h-auto w-full max-h-[min(78vh,720px)] object-contain"
                : "h-auto w-full max-h-[600px] object-contain"
            }
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
