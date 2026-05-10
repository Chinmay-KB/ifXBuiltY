"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { ShowcaseExample } from "@/data/showcase-examples";
import { showcaseImageUrl } from "@/data/showcase-examples";
import { cn } from "@/lib/cn";
import { SHOWCASE_ROTATOR_SIZES } from "@/lib/generation-image-sizes";

const ROTATION_INTERVAL_MS = 5000;

type ShowcaseRotatorProps = {
  examples: ShowcaseExample[];
};

/**
 * ShowcaseRotator — continuously cycling showcase images with crossfade.
 *
 * Displays a rotating gallery of showcase generation examples on the homepage.
 * Cross-fades between items every 5 seconds with a ≤700ms transition.
 * Respects prefers-reduced-motion by showing a static first image.
 *
 * Validates: Requirements 9.6
 */
export function ShowcaseRotator({ examples }: ShowcaseRotatorProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(examples.length > 1 ? 1 : 0);
  const [showNext, setShowNext] = useState(false);

  const slideRef = useRef({
    currentIndex: 0,
    nextIndex: examples.length > 1 ? 1 : 0,
    showNext: false,
  });

  useEffect(() => {
    slideRef.current = { currentIndex, nextIndex, showNext };
  }, [currentIndex, nextIndex, showNext]);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Slideshow rotation
  useEffect(() => {
    if (examples.length <= 1 || reducedMotion) return;

    const id = window.setInterval(() => {
      const snap = slideRef.current;
      const visibleIdx = snap.showNext ? snap.nextIndex : snap.currentIndex;
      let next = (visibleIdx + 1) % examples.length;
      if (next === visibleIdx) {
        next = (next + 1) % examples.length;
      }

      if (snap.showNext) {
        setCurrentIndex(next);
        setShowNext(false);
      } else {
        setNextIndex(next);
        setShowNext(true);
      }
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [examples.length, reducedMotion]);

  if (examples.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-panel ring-1 ring-line">
        <span className="font-display text-2xl text-ink/30">ifXbuiltY</span>
      </div>
    );
  }

  const transitionClass = reducedMotion
    ? "duration-0"
    : "duration-[var(--transition-duration-slow)] ease-in-out";

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-panel ring-1 ring-line">
      {/* Layer A */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative h-full max-h-full w-full max-w-full">
          {examples[currentIndex] ? (
            <Image
              src={showcaseImageUrl(examples[currentIndex])}
              alt={
                examples[currentIndex]?.builder && examples[currentIndex]?.target
                  ? `if ${examples[currentIndex].builder} built ${examples[currentIndex].target}`
                  : "Showcase example"
              }
              fill
              sizes={SHOWCASE_ROTATOR_SIZES}
              className={cn(
                "rounded-lg object-contain transition-opacity",
                transitionClass,
                showNext ? "opacity-0" : "opacity-100",
              )}
            />
          ) : null}
        </div>
      </div>
      {/* Layer B */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative h-full max-h-full w-full max-w-full">
          {examples[nextIndex] ? (
            <Image
              src={showcaseImageUrl(examples[nextIndex])}
              alt={
                examples[nextIndex]?.builder && examples[nextIndex]?.target
                  ? `if ${examples[nextIndex].builder} built ${examples[nextIndex].target}`
                  : "Showcase example"
              }
              fill
              sizes={SHOWCASE_ROTATOR_SIZES}
              className={cn(
                "rounded-lg object-contain transition-opacity",
                transitionClass,
                showNext ? "opacity-100" : "opacity-0",
              )}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
