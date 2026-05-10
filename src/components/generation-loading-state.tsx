"use client";

import { useEffect, useState } from "react";

import {
  getLoadingMessages,
  getRandomFunFact,
} from "@/data/loading-entertainment";
import { cn } from "@/lib/cn";

const ROTATION_INTERVAL_MS = 3500;

type Props = {
  /** The builder name — used to show builder-specific loading messages */
  builder?: string;
};

/**
 * GenerationLoadingState — displayed while AI generation is in progress.
 *
 * Features:
 * - Microcopy rotator cycling every 3.5s
 * - Indeterminate progress indicator
 * - Fun fact panel
 * - Respects prefers-reduced-motion (disables auto-play, 0ms transitions)
 */
export function GenerationLoadingState({ builder }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [microcopyIndex, setMicrocopyIndex] = useState(0);

  // Get builder-specific messages
  const loadingMessages = getLoadingMessages(builder ?? "");
  const [funFact] = useState(() => getRandomFunFact(builder ?? ""));

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Microcopy rotation
  useEffect(() => {
    if (reducedMotion) return;

    const id = window.setInterval(() => {
      setMicrocopyIndex((prev) => (prev + 1) % loadingMessages.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [reducedMotion, loadingMessages.length]);

  return (
    <div
      className="flex flex-col items-center gap-6"
      role="status"
      aria-live="polite"
      aria-label="Generation in progress"
    >
      {/* Branded placeholder */}
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-xl bg-panel ring-1 ring-line">
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-ink/5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-display text-2xl text-ink/30">ifXbuiltY</span>
            <span className="text-sm text-muted">Generating your creation…</span>
          </div>
        </div>
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
        {loadingMessages[microcopyIndex % loadingMessages.length]}
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

      {/* Fun fact — "While you wait" */}
      {funFact && (
        <div className="mt-2 w-full max-w-[400px] rounded-xl border border-line bg-canvas p-4">
          <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.04em] text-muted">
            While you wait
          </p>
          <p className="text-sm leading-relaxed text-ink">
            {funFact}
          </p>
        </div>
      )}
    </div>
  );
}
