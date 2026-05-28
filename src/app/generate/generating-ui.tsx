"use client";

import { useEffect, useMemo, useState } from "react";

import { getAllFunFacts, getLoadingMessages } from "@/data/loading-entertainment";
import { cn } from "@/lib/cn";
import type { GenerationInputs } from "@/lib/ui/types";

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return reducedMotion;
}

const EXPECTED_GENERATION_SECONDS = 60;

export function PromptComposition({
  builder,
  target,
}: {
  builder: string;
  target: string;
}) {
  const b = builder.trim() || "…";
  const t = target.trim() ? `${target.trim()}.` : "…";
  return (
    <div className="flex w-full max-w-120 flex-col gap-3">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        Now composing
      </p>
      <div className="mt-0.5 font-display tracking-[-0.028em]">
        <p className="text-[clamp(1.05rem,1.6vw,1.35rem)] font-semibold leading-[1.02] text-ink/80 motion-safe:animate-loader-prompt-label-in">
          If
        </p>
        <p className="relative text-[clamp(2.25rem,4.8vw,3.95rem)] font-black italic leading-[0.88] text-chrome [text-shadow:0_2px_0_rgba(10,10,10,0.16)] motion-safe:animate-loader-prompt-pop">
          {b}
        </p>
        <p className="mt-1 text-[clamp(1.05rem,1.6vw,1.35rem)] font-semibold leading-[1.02] text-ink/80 motion-safe:animate-loader-prompt-label-in">
          built
        </p>
        <p className="relative text-[clamp(2.25rem,4.8vw,3.95rem)] font-black italic leading-[0.88] text-chrome [text-shadow:0_2px_0_rgba(10,10,10,0.16)] motion-safe:animate-loader-prompt-pop">
          {t}
        </p>
      </div>
    </div>
  );
}

export function PaperGeneratingPanel({
  inputs,
  compact,
}: {
  inputs: GenerationInputs;
  compact?: boolean;
}) {
  const messages = getLoadingMessages(inputs.builder, inputs.builderId);
  const facts = useMemo(
    () => getAllFunFacts(inputs.builder, inputs.builderId),
    [inputs.builder, inputs.builderId],
  );
  const reducedMotion = usePrefersReducedMotion();
  const [msgIndex, setMsgIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (reducedMotion || messages.length <= 1) return;
    const id = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 5200);
    return () => clearInterval(id);
  }, [messages.length, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || facts.length <= 1) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const phaseOffset = setTimeout(() => {
      setFactIndex((prev) => (prev + 1) % facts.length);
      intervalId = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % facts.length);
      }, 8300);
    }, 2600);
    return () => {
      clearTimeout(phaseOffset);
      if (intervalId) clearInterval(intervalId);
    };
  }, [facts.length, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const start = performance.now();
    const id = setInterval(() => {
      setElapsed((performance.now() - start) / 1000);
    }, 250);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const k = EXPECTED_GENERATION_SECONDS / 2.2;
  const visiblePct = reducedMotion
    ? 70
    : Math.min(95, Math.round(95 * (1 - Math.exp(-elapsed / k))));

  const b = inputs.builder || "your builder";
  const t = inputs.target || "your target";
  const message =
    messages[msgIndex % messages.length] ?? "Composing the alternate timeline.";
  const showFact = facts.length > 0;

  return (
    <div
      className={cn("flex w-full flex-col", compact ? "gap-3" : "gap-4")}
      role="status"
      aria-live="polite"
      aria-label={`Generating a satirical screenshot: if ${b} built ${t}`}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-[20px] border border-line bg-canvas",
          compact ? "aspect-4/3" : "aspect-16/10",
        )}
        style={{
          backgroundImage:
            "linear-gradient(180deg, oklab(96.9% -0.002 0.006) 0%, oklab(93.9% -0.002 0.011) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "radial-gradient(circle farthest-corner at 20% 30% in oklab, oklab(88.5% -0.016 0.181 / 15%) 0%, oklab(0% 0 0 / 0%) 40%), radial-gradient(circle farthest-corner at 80% 70% in oklab, oklab(65.4% 0.204 0.111 / 8%) 0%, oklab(0% 0 0 / 0%) 40%)",
          }}
        />
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-chrome/15 px-3 py-1.5 lg:right-5 lg:top-5">
          <span className="size-2 rounded-full bg-chrome" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-chrome">
            Rendering
          </span>
        </div>
        <div
          className={cn(
            "absolute flex flex-col",
            compact ? "inset-x-6 top-6 gap-2.5" : "inset-x-10 top-10 gap-4",
          )}
        >
          {[48, 74, 36, 66, 52, 80, 42].map((w, i) => (
            <div
              key={`sk-${i}-${w}`}
              className={cn("rounded-sm bg-ink/6", compact ? "h-3" : "h-4")}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-x-[14%] h-[2px] rounded-full bg-chrome shadow-[0_0_10px_rgba(234,179,8,0.55)] motion-safe:transition-[top] motion-safe:duration-1000"
          style={{ top: `${20 + (visiblePct % 50)}%` }}
          aria-hidden
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              key={`radio-${msgIndex}`}
              className="size-3.5 shrink-0 rounded-full border-[2.5px] border-ink motion-safe:animate-loader-radio-pulse"
            />
            <div className="relative min-w-0 overflow-hidden">
              <p
                key={`msg-${msgIndex}`}
                className={cn(
                  "min-w-0 font-sans font-semibold text-ink motion-safe:animate-loader-message-in",
                  compact ? "line-clamp-2 text-[13px]" : "text-[15px]",
                )}
              >
                {message}
              </p>
            </div>
          </div>
          <p className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-muted">
            {visiblePct}%
          </p>
        </div>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-ink motion-safe:transition-[width] motion-safe:duration-700"
            style={{ width: `${visiblePct}%` }}
            aria-hidden
          />
        </div>
      </div>

      {showFact ? (
        <div className="relative flex gap-3.5 overflow-hidden rounded-r-xl border-l-2 border-chrome bg-[#FFF9E0] py-3.5 pl-4 pr-4">
          <span
            key={`glow-${factIndex}`}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-chrome/25 to-transparent motion-safe:animate-loader-fact-glow"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-black">
              Did you know
            </p>
            <p
              key={`fact-${factIndex}`}
              className={cn(
                "leading-[145%] text-[#333] motion-safe:animate-loader-fact-in",
                compact ? "text-[13px]" : "text-[14px]",
              )}
            >
              {facts[factIndex]}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MobileGeneratingDock({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="fixed inset-x-3 bottom-16 z-40 rounded-[18px] border border-line bg-canvas/95 p-2 shadow-[0_14px_50px_rgba(0,0,0,0.14)] backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="size-2.5 shrink-0 rounded-full bg-chrome ring-4 ring-chrome/20" />
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink">
              Generating
            </p>
            <p className="truncate text-[12px] font-medium text-muted">
              Keep this open while the mockup renders.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-full border border-line bg-panel px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

