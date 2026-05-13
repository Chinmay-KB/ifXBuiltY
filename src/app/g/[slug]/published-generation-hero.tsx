"use client";

import Zoom from "@/components/image-zoom";

type Props = {
  imageUrl: string;
  title: string;
  variant?: "default" | "paper";
};

export function PublishedGenerationHero({
  imageUrl,
  title,
  variant = "default",
}: Props) {
  const frame =
    variant === "paper"
      ? "relative mx-auto w-full overflow-hidden rounded-[28px] border border-line bg-panel"
      : "relative mx-auto w-full max-w-[600px] overflow-hidden rounded-lg";

  return (
    <section className={frame}>
      <div className="relative bg-canvas">
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
                ? "h-auto w-full max-h-[min(50svh,460px)] object-contain sm:max-h-[min(72vh,680px)] lg:max-h-[min(78vh,720px)]"
                : "h-auto w-full max-h-[600px] object-contain"
            }
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
