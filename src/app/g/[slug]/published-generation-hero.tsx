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

/** Mobile 9:16 — height-led sizing so the mockup fills the viewport column. */
const MOBILE_HERO_SIZE =
  "h-[min(78svh,720px)] w-auto max-w-full";
/** Desktop 16:9 — width-led sizing within the column. */
const DESKTOP_HERO_SIZE =
  "w-full max-h-[min(58svh,540px)]";

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
            width={isMobile ? 1024 : 1792}
            height={isMobile ? 1792 : 1024}
            sizes={variant === "paper" ? "(max-width: 1024px) 100vw, 65vw" : "(max-width: 768px) 100vw, 600px"}
            className={cn(
              "object-contain",
              isMobile ? MOBILE_HERO_SIZE : DESKTOP_HERO_SIZE,
            )}
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
