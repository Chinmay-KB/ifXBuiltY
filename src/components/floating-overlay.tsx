"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

const EXAMPLE_PROMPTS = [
  { label: "Duolingo x LinkedIn", builder: "Duolingo", target: "LinkedIn" },
  { label: "IKEA x Tax Filing", builder: "IKEA", target: "Tax Filing Portal" },
  { label: "Spotify x Dental Clinic", builder: "Spotify", target: "Dental Clinic Booking" },
];

/** Builder names to cycle through in the prompt bar */
const CYCLING_BUILDERS = [
  "Duolingo",
  "IKEA",
  "Spotify",
  "Apple",
  "Indian Govt",
  "LinkedIn",
  "Robinhood",
  "Google",
];

/** Target names to cycle through in the prompt bar */
const CYCLING_TARGETS = [
  "LinkedIn",
  "Tax Filing",
  "Tinder",
  "DMV",
  "Airport",
  "Gmail",
  "Pharmacy",
  "Dating App",
];

const BUILDER_INTERVAL = 2500;
const TARGET_INTERVAL = 3200; // Slightly offset so they don't change at the same time

/**
 * Cycling text with enter animation + smooth width interpolation (FLIP-style).
 * Inline width jumps when X/Y length changes; we measure old vs new and animate `width`.
 */
function CyclingText({
  words,
  interval,
  className,
}: {
  words: string[];
  interval: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const prevWidthPx = useRef<number | null>(null);

  useEffect(() => {
    if (words.length <= 1) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
      setTick((t) => t + 1);
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const wNew = inner.getBoundingClientRect().width;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prevWidthPx.current === null) {
      prevWidthPx.current = wNew;
      container.style.transition = "none";
      container.style.width = `${wNew}px`;
      return;
    }

    const wOld = prevWidthPx.current;
    prevWidthPx.current = wNew;

    if (reduceMotion || Math.abs(wOld - wNew) < 0.5) {
      container.style.transition = "none";
      container.style.width = `${wNew}px`;
      return;
    }

    container.style.transition = "none";
    container.style.width = `${wOld}px`;
    void container.offsetHeight;
    container.style.transition =
      "width 0.38s cubic-bezier(0.22, 1, 0.36, 1)";
    container.style.width = `${wNew}px`;
  }, [index, tick, words]);

  return (
    <span
      ref={containerRef}
      className={cn(
        "inline-block min-h-[1.35em] overflow-hidden align-middle",
        className,
      )}
    >
      <span
        key={tick}
        ref={innerRef}
        className={cn(
          "inline-block whitespace-nowrap",
          tick > 0 && "animate-cycle-word-enter",
        )}
      >
        {words[index]}
      </span>
    </span>
  );
}

/**
 * Floating overlay with tagline + animated prompt bar, centered over the wall.
 * White card with frosted glass effect — matches Paper design.
 */
export function FloatingOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY <= 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto mx-4 flex w-full max-w-[640px] flex-col items-center gap-6 rounded-3xl bg-white/95 px-8 py-12 shadow-[0_24px_80px_rgba(0,0,0,0.15)] backdrop-blur-sm sm:px-14 sm:py-12">
        {/* Headline */}
        <h1 className="text-center font-display text-[42px] font-black leading-[1.1] tracking-tight text-ink sm:text-[52px]">
          What if X<br />built Y?
        </h1>

        {/* Subline */}
        <p className="text-center text-[17px] leading-relaxed text-muted">
          Explore product design from parallel universes.
          <br />
          One prompt. Infinite timelines.
        </p>

        {/* Animated prompt bar */}
        <Link
          href="/generate"
          className="flex w-full items-center gap-0 overflow-hidden rounded-xl"
        >
          <div className="flex flex-1 items-center gap-2.5 overflow-hidden border-2 border-r-0 border-line-strong bg-panel px-5 py-3.5 rounded-l-xl">
            <span className="text-[15px] font-semibold text-ink">If</span>
            <CyclingText
              words={CYCLING_BUILDERS}
              interval={BUILDER_INTERVAL}
              className="text-[15px] font-medium text-ink/70"
            />
            <span className="text-[15px] font-semibold text-ink">built</span>
            <CyclingText
              words={CYCLING_TARGETS}
              interval={TARGET_INTERVAL}
              className="text-[15px] font-medium text-ink/70"
            />
          </div>
          <div className="flex items-center bg-chrome px-6 py-3.5 rounded-r-xl">
            <span className="text-[15px] font-bold text-ink">
              Generate →
            </span>
          </div>
        </Link>

        {/* Example chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[13px] text-muted">or try:</span>
          {EXAMPLE_PROMPTS.map((ex) => (
            <Link
              key={ex.label}
              href={`/generate?builder=${encodeURIComponent(ex.builder)}&target=${encodeURIComponent(ex.target)}`}
              className="rounded-md bg-panel px-2.5 py-1 text-[13px] font-medium text-ink transition-colors hover:bg-line"
            >
              {ex.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
