"use client";

import { useEffect, useRef, useState } from "react";

import type { ShowcaseExample } from "@/data/showcase-examples";
import { cn } from "@/lib/cn";

const ROTATION_INTERVAL_MS = 5000;

const microcopy = [
  "Overthinking the interface...",
  "Adding unnecessary gradients...",
  "Consulting the brand guidelines...",
  "Debating font choices...",
  "Removing features for simplicity...",
  "Making it pop...",
  "Aligning pixels by hand...",
  "Asking the intern for feedback...",
] as const;

type Props = {
  showcaseExamples: ShowcaseExample[];
};

/**
 * GenerationLoadingState — displayed while AI generation is in progress.
 *
 * Features:
 * - Showcase slideshow rotating every 5s with cross-fade (≤700ms)
 * - Microcopy rotator cycling every 5s
 * - Indeterminate progress indicator
 * - Static placeholder fallback when no showcase examples available
 * - Respects prefers-reduced-motion (disables auto-play, 0ms transitions)
 */
export function GenerationLoadingState({ showcaseExamples }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(
    showcaseExamples.length > 1 ? 1 : 0,
  );
  const [showNext, setShowNext] = useState(false);
  const [microcopyIndex, setMicrocopyIndex] = useState(0);

  // Track mutable state for interval callbacks
  const slideRef = useRef({
    currentIndex: 0,
    nextIndex: showcaseExamples.length > 1 ? 1 : 0,
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
    if (showcaseExamples.length <= 1 || reducedMotion) return;

    const id = window.setInterval(() => {
      const snap = slideRef.current;
      const visibleIdx = snap.showNext ? snap.nextIndex : snap.currentIndex;
      let next = (visibleIdx + 1) % showcaseExamples.length;
      // Avoid showing the same image
      if (next === visibleIdx) {
        next = (next + 1) % showcaseExamples.length;
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
  }, [showcaseExamples.length, reducedMotion]);

  // Microcopy rotation
  useEffect(() => {
    if (reducedMotion) return;

    const id = window.setInterval(() => {
      setMicrocopyIndex((prev) => (prev + 1) % microcopy.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const transitionClass = reducedMotion
    ? "duration-0"
    : "duration-[var(--transition-duration-slow)] ease-in-out";

  return (
    <div
      className="flex flex-col items-center gap-6"
      role="status"
      aria-live="polite"
      aria-label="Generation in progress"
    >
      {/* Showcase slideshow or static placeholder */}
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-xl bg-panel ring-1 ring-line">
        {showcaseExamples.length > 0 ? (
          <div className="relative aspect-[4/3] w-full">
            {/* Layer A */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showcaseExamples[currentIndex]?.imageSrc}
                alt={showcaseExamples[currentIndex]?.builder && showcaseExamples[currentIndex]?.target
                  ? `if ${showcaseExamples[currentIndex].builder} built ${showcaseExamples[currentIndex].target}`
                  : "Showcase example"}
                className={cn(
                  "max-h-full max-w-full rounded-lg object-contain transition-opacity",
                  transitionClass,
                  showNext ? "opacity-0" : "opacity-100",
                )}
              />
            </div>
            {/* Layer B */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showcaseExamples[nextIndex]?.imageSrc}
                alt={showcaseExamples[nextIndex]?.builder && showcaseExamples[nextIndex]?.target
                  ? `if ${showcaseExamples[nextIndex].builder} built ${showcaseExamples[nextIndex].target}`
                  : "Showcase example"}
                className={cn(
                  "max-h-full max-w-full rounded-lg object-contain transition-opacity",
                  transitionClass,
                  showNext ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          </div>
        ) : (
          /* Static branded placeholder when no showcase examples */
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-ink/5">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="font-display text-2xl text-ink/30">ifXbuiltY</span>
              <span className="text-sm text-muted">Generating your creation…</span>
            </div>
          </div>
        )}
      </div>

      {/* Microcopy rotator */}
      <p
        className={cn(
          "text-center text-sm font-medium text-muted transition-opacity",
          reducedMotion ? "duration-0" : "duration-300 ease-in-out",
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {microcopy[microcopyIndex]}
      </p>

      {/* Indeterminate progress indicator */}
      <div
        className="h-1 w-48 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Generation progress"
      >
        <div
          className={cn(
            "h-full w-1/3 rounded-full bg-chrome",
            reducedMotion
              ? "translate-x-[100%]"
              : "animate-[indeterminate_1.5s_ease-in-out_infinite]",
          )}
        />
      </div>
    </div>
  );
}
