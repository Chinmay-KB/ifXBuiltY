"use client";

import Zoom from "@/components/image-zoom";
import { cn } from "@/lib/cn";
import { normalizeRenderMode } from "@/lib/screen-type";

type Props = {
  imageUrl: string;
  title: string;
  screenType?: string;
  variant?: "default" | "paper";
};

/** Frame follows the image; cap height so 2–3 UI labels stay readable. */
const HERO_IMG =
  "mx-auto block h-auto w-full max-h-[min(82svh,920px)] object-contain object-top";

export function PublishedGenerationHero({
  imageUrl,
  title,
  screenType,
  variant = "default",
}: Props) {
  const isMobile = normalizeRenderMode(screenType ?? "desktop") === "mobile";
  const frame =
    variant === "paper"
      ? "relative mx-auto w-full overflow-hidden rounded-[28px] border border-line bg-panel"
      : "relative mx-auto w-full max-w-[600px] overflow-hidden rounded-lg";

  return (
    <section className={cn(frame, variant === "paper" && "motion-safe:animate-detail-hero-enter")}>
      <div
        className={cn(
          "flex justify-center bg-canvas",
          isMobile ? "px-3 py-4 sm:px-5 sm:py-5" : "px-2 py-3 sm:px-4 sm:py-4",
        )}
      >
        <Zoom>
          {/* eslint-disable-next-line @next/next/no-img-element -- rmiz measures native <img>; Next/Image breaks zoom geometry */}
          <img
            src={imageUrl}
            alt={title}
            sizes={
              variant === "paper"
                ? "(max-width: 1024px) 100vw, 65vw"
                : "(max-width: 768px) 100vw, 600px"
            }
            className={cn(HERO_IMG, isMobile && "max-w-[460px]")}
            fetchPriority="high"
            decoding="async"
          />
        </Zoom>
      </div>
      {variant === "paper" ? (
        <p className="border-t border-line bg-panel px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          Tap image to inspect
        </p>
      ) : null}
    </section>
  );
}
