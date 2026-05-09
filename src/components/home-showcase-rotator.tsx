"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ShowcaseExample } from "@/data/showcase-examples";
import { showcaseImageUrl } from "@/data/showcase-examples";
import { cn } from "@/lib/cn";

const INTERVAL_MS = 5200;

type Props = {
  examples: ShowcaseExample[];
};

function pickNextIndex(visible: number, len: number): number {
  if (len <= 1) return visible;
  let n = visible;
  while (n === visible) {
    n = Math.floor(Math.random() * len);
  }
  return n;
}

export function HomeShowcaseRotator({ examples }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [iA, setIa] = useState(0);
  const [iB, setIb] = useState(() => (examples.length > 1 ? 1 : 0));
  const [showTop, setShowTop] = useState(false);
  const [headlineIdx, setHeadlineIdx] = useState(0);

  const rotateMetaRef = useRef({ iA: 0, iB: examples.length > 1 ? 1 : 0, showTop: false });
  useEffect(() => {
    rotateMetaRef.current = { iA, iB, showTop };
  }, [iA, iB, showTop]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (examples.length === 0 || reducedMotion) return;

    const id = window.setInterval(() => {
      const snap = rotateMetaRef.current;
      const visible = snap.showTop ? snap.iB : snap.iA;
      const top = snap.showTop;
      const next = pickNextIndex(visible, examples.length);
      setHeadlineIdx(next);
      if (top) {
        setIa(next);
        setShowTop(false);
      } else {
        setIb(next);
        setShowTop(true);
      }
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [examples.length, reducedMotion]);

  const transitionClass = reducedMotion
    ? "duration-0"
    : "duration-700 ease-out";

  const imgPair = useMemo(() => {
    if (examples.length === 0) return null;
    return (
      <div
        className="relative isolate mx-auto w-full max-w-[380px] shrink-0 overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/10"
        aria-hidden
      >
        <div className="relative aspect-square w-full">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                examples[iA] ? showcaseImageUrl(examples[iA]) : undefined
              }
              alt=""
              className={cn(
                "max-h-full max-w-full rounded-lg object-contain transition-opacity",
                transitionClass,
                showTop ? "pointer-events-none opacity-0" : "opacity-100",
              )}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                examples[iB] ? showcaseImageUrl(examples[iB]) : undefined
              }
              alt=""
              className={cn(
                "max-h-full max-w-full rounded-lg object-contain transition-opacity",
                transitionClass,
                showTop ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            />
          </div>
        </div>
      </div>
    );
  }, [examples, iA, iB, showTop, transitionClass]);

  if (examples.length === 0) {
    return (
      <p className="text-on-dark-soft text-sm">
        No showcase samples configured yet.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-shrink-0 flex-col gap-4">
      {imgPair}

      <div className="flex flex-col gap-1">
        <p
          aria-live="polite"
          aria-atomic="true"
          className="font-display text-2xl leading-tight text-white sm:text-4xl sm:leading-tight"
        >
          if {examples[headlineIdx].builder} built{" "}
          {examples[headlineIdx].target}
        </p>
        <p className="text-[13px] font-medium text-white/45">
          {reducedMotion
            ? "Reduced motion is on — this pair stays put."
            : "A new combo every few seconds."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl rounded-full bg-white/10 px-2.5 py-2 text-[13px] text-on-dark-soft">
          Suggested excuse: “{examples[headlineIdx].target} but with streak
          anxiety.”
        </p>
        <span className="rounded-full bg-[#E8E306] px-3 py-2 text-[13px] font-black text-ink">
          ifXbuiltY
        </span>
      </div>
    </div>
  );
}
