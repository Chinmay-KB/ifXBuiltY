"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CreditsModal } from "@/components/credits-modal";
import { GenerationResultView } from "@/components/generation-result-view";
import { GeneratorForm, type GeneratorCompanyOption } from "@/components/generator-form";
import { useNavigationGenerating } from "@/components/navigation-generating-context";
import { getAllFunFacts, getLoadingMessages } from "@/data/loading-entertainment";
import { useCredits } from "@/hooks/use-credits";
import { cn } from "@/lib/cn";
import type { GenerationInputs, GenerationResult } from "@/lib/ui/types";

type Starter = {
  builder: string;
  target: string;
  label: string;
  swatchClass: string;
  labelClass: string;
};

const STARTER_SWATCHES: { swatchClass: string; labelClass: string }[] = [
  { swatchClass: "from-ink to-ink/80", labelClass: "text-chrome" },
  { swatchClass: "from-ink to-emerald-950", labelClass: "text-white" },
  { swatchClass: "bg-chrome", labelClass: "text-ink" },
  { swatchClass: "from-barrier to-red-800", labelClass: "text-white" },
  { swatchClass: "bg-[#1A2238]", labelClass: "text-[#A0B4D4]" },
  { swatchClass: "bg-[#3A2A4E]", labelClass: "text-chrome" },
];

const GENERATING_STEPS = [
  "Reading the room",
  "Sketching the product",
  "Rendering the interface",
  "Polishing the joke",
];

function buildCompanyPairPool(companies: GeneratorCompanyOption[]): { builder: string; target: string }[] {
  if (companies.length < 2) return [];
  const pairs: { builder: string; target: string }[] = [];
  for (let i = 0; i < companies.length; i++) {
    for (let j = 0; j < companies.length; j++) {
      if (i === j) continue;
      pairs.push({
        builder: companies[i]!.name,
        target: companies[j]!.name,
      });
    }
  }
  return pairs;
}

function pairToStarter(p: { builder: string; target: string }, styleIndex: number): Starter {
  const sw = STARTER_SWATCHES[styleIndex % STARTER_SWATCHES.length]!;
  return {
    builder: p.builder,
    target: p.target,
    label: `${p.builder} × ${p.target}`,
    swatchClass: sw.swatchClass,
    labelClass: sw.labelClass,
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = (seed + i * 17) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function starterHref(s: Starter) {
  const q = new URLSearchParams();
  q.set("builder", s.builder);
  q.set("target", s.target);
  return `/generate?${q.toString()}`;
}

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

function PaperGeneratingPanel({
  inputs,
  compact,
}: {
  inputs: GenerationInputs;
  compact?: boolean;
}) {
  const messages = getLoadingMessages(inputs.builder);
  const facts = useMemo(() => getAllFunFacts(inputs.builder), [inputs.builder]);
  const reducedMotion = usePrefersReducedMotion();
  const [msgIndex, setMsgIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [pct, setPct] = useState(18);

  useEffect(() => {
    if (reducedMotion || messages.length <= 1) return;
    const id = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(id);
  }, [messages.length, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || facts.length <= 1) return;
    const id = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % facts.length);
    }, 6000);
    return () => clearInterval(id);
  }, [facts.length, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setPct((p) => (p >= 94 ? p : p + 3));
    }, 900);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const b = inputs.builder || "your builder";
  const t = inputs.target || "your target";
  const visiblePct = reducedMotion ? 72 : pct;
  const step = Math.min(4, Math.max(1, Math.ceil((visiblePct / 100) * 4)));
  const message = messages[msgIndex % messages.length] ?? "Composing the alternate timeline.";

  return (
    <div
      className={cn("flex w-full flex-col", compact ? "min-h-0 flex-1 gap-3" : "gap-4 lg:max-w-none")}
      role="status"
      aria-live="polite"
      aria-label={`Generating a satirical screenshot: if ${b} built ${t}`}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[20px] border border-line bg-canvas",
          compact ? "min-h-0 flex-1" : "min-h-[280px] lg:min-h-[360px]",
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
        <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-chrome/15 px-3 py-1.5">
          <span className="size-2 rounded-full bg-chrome" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-chrome">
            Rendering
          </span>
        </div>
        <div className={cn("absolute inset-x-10 flex flex-col", compact ? "top-6 gap-2" : "top-10 gap-4")}>
          {(compact ? [48, 70, 40, 62] : [48, 74, 36, 66, 52, 80, 42]).map((w, i) => (
            <div
              key={`sk-${i}-${w}`}
              className={cn("rounded-sm bg-ink/6", compact ? "h-3" : "h-4")}
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-x-[18%] h-[2px] rounded-full bg-chrome shadow-[0_0_10px_rgba(234,179,8,0.55)] motion-safe:transition-[top] motion-safe:duration-700"
          style={{ top: `${22 + (visiblePct % 38)}%` }}
          aria-hidden
        />
      </div>

      {!compact ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Generation steps">
          {GENERATING_STEPS.map((label, index) => {
            const isDone = index + 1 < step;
            const isActive = index + 1 === step;
            return (
              <div
                key={label}
                className={cn(
                  "rounded-[14px] border px-3.5 py-3",
                  isActive
                    ? "border-ink bg-chrome text-ink"
                    : isDone
                      ? "border-ink bg-ink text-chrome"
                      : "border-line bg-panel text-muted",
                )}
              >
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em]">
                  {`0${index + 1}`}
                </p>
                <p className="mt-1.5 text-[13px] font-bold leading-[1.15]">{label}</p>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className={cn("flex flex-col", compact ? "shrink-0 gap-2" : "gap-3")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "shrink-0 rounded-full border-[2.5px] border-ink",
                compact ? "size-3" : "size-[18px]",
              )}
            />
            <p
              className={cn(
                "min-w-0 font-sans font-semibold text-ink",
                compact ? "line-clamp-2 text-xs" : "text-base",
              )}
            >
              {message}
            </p>
          </div>
          <p className="shrink-0 rounded-full bg-panel px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink">
            Step {step} of 4
          </p>
        </div>
      </div>

      {facts.length > 0 && !compact && (
        <div className="flex gap-3.5 rounded-r-xl border-l-2 border-chrome bg-[#FFF9E0] py-4 pl-5 pr-4">
          <span className="font-display text-[28px] font-black italic leading-none text-chrome">
            †
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-chrome">
              Did you know
            </p>
            <p className="text-[14px] leading-[145%] text-[#333]">
              {facts[factIndex]}
            </p>
          </div>
        </div>
      )}

      {!compact && (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Now composing · {b} → {t}
        </p>
      )}
    </div>
  );
}

function MobileGeneratingDock({ onCancel }: { onCancel: () => void }) {
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

type Phase = "input" | "loading" | "result" | "error";

const defaultInputs: GenerationInputs = {
  builder: "",
  target: "",
  extraDetails: "",
};

type GeneratePageClientProps = {
  signedIn: boolean;
  initialBuilder?: string;
  initialTarget?: string;
  companies: GeneratorCompanyOption[];
};

export function GeneratePageClient({
  signedIn,
  initialBuilder,
  initialTarget,
  companies,
}: GeneratePageClientProps) {
  const [phase, setPhase] = useState<Phase>("input");
  const [currentInputs, setCurrentInputs] = useState<GenerationInputs>({
    ...defaultInputs,
    builder: initialBuilder ?? "",
    target: initialTarget ?? "",
  });
  const [lastInputs, setLastInputs] = useState<GenerationInputs>(defaultInputs);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  const startersRef = useRef<HTMLDivElement | null>(null);
  const abortGenRef = useRef<(() => void) | null>(null);
  const { refresh: refreshCredits } = useCredits(signedIn);
  const { setGenerating, clearGenerating } = useNavigationGenerating();

  const submittedInputsRef = useRef<GenerationInputs>(defaultInputs);

  useEffect(() => {
    if (phase !== "loading") {
      clearGenerating();
      return;
    }
    setGenerating(() => {
      abortGenRef.current?.();
      setPhase("input");
      clearGenerating();
    });
    return () => {
      clearGenerating();
    };
  }, [phase, setGenerating, clearGenerating]);

  const starters = useMemo(() => {
    const pool = buildCompanyPairPool(companies);
    if (pool.length === 0) return [];
    const shuffled = shuffle(pool, shuffleKey);
    return shuffled.slice(0, 4).map((p, i) => pairToStarter(p, i));
  }, [companies, shuffleKey]);

  const handleGenerating = useCallback((inputs: GenerationInputs) => {
    submittedInputsRef.current = inputs;
    setCurrentInputs(inputs);
    setPhase("loading");
    setError(null);
  }, []);

  const handleGenerated = useCallback(
    (result: GenerationResult) => {
      setGenerationResult(result);
      setLastInputs(submittedInputsRef.current);
      setPhase("result");
      void refreshCredits();
    },
    [refreshCredits],
  );

  const handleError = useCallback((errorMsg: string, inputs: GenerationInputs) => {
    setError(errorMsg);
    setCurrentInputs(inputs);
    setPhase("error");
  }, []);

  const handleInsufficientCredits = useCallback(() => {
    setPhase("input");
    setShowCreditsModal(true);
  }, []);

  const handleReset = useCallback(() => {
    setPhase("input");
    setGenerationResult(null);
    setError(null);
    setCurrentInputs(defaultInputs);
    setLastInputs(defaultInputs);
  }, []);

  const handleRegenerate = useCallback(
    async (inputs: GenerationInputs) => {
      setCurrentInputs(inputs);
      setPhase("loading");
      setError(null);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const code = (body as { code?: string }).code;
          if (code === "insufficient_credits") {
            setPhase("input");
            setShowCreditsModal(true);
            return;
          }
          const message =
            (body as { error?: string }).error || `Generation failed (${res.status})`;
          setError(message);
          setPhase("error");
          return;
        }

        const data = await res.json();
        const result: GenerationResult = {
          id: data.id,
          slug: data.slug,
          imageUrl: data.imageUrl,
          builder: inputs.builder,
          target: inputs.target,
        };

        setGenerationResult(result);
        setLastInputs(inputs);
        setPhase("result");
        void refreshCredits();
      } catch {
        setError("Network error. Please check your connection and try again.");
        setPhase("error");
      }
    },
    [refreshCredits],
  );

  if (phase === "result" && generationResult) {
    return (
      <>
        <div className="flex w-full flex-1 min-h-0 flex-col px-3 py-2 sm:px-8 lg:px-10 lg:py-3">
          <div className="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col">
            <GenerationResultView
              variant="paper"
              viewportContained
              result={generationResult}
              currentInputs={currentInputs}
              lastInputs={lastInputs}
              onReset={handleReset}
              onRegenerate={handleRegenerate}
            />
          </div>
        </div>

        <CreditsModal
          open={showCreditsModal}
          onClose={() => setShowCreditsModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex w-full flex-1 min-h-0 flex-col px-4 py-2 sm:px-8 md:px-10 lg:flex-row lg:gap-10 lg:px-16 lg:py-4">
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col lg:max-w-[560px] lg:shrink-0">
          <div className="shrink-0 lg:mb-2">
            {phase === "loading" ? (
              <>
                <div className="hidden lg:block">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    Now composing
                  </p>
                  <p className="mt-3 font-display text-[clamp(2.25rem,4.5vw,3.25rem)] font-black leading-[0.95] tracking-[-0.04em]">
                    <span className="text-chrome">If</span>{" "}
                    <span className="text-ink">{currentInputs.builder || "…"}</span>{" "}
                    <span className="text-chrome">built</span>{" "}
                    <span className="text-ink">
                      {currentInputs.target ? `${currentInputs.target}.` : "…"}
                    </span>
                  </p>
                </div>
                <div className="lg:hidden">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    One prompt. Infinite timelines.
                  </p>
                  <h1 className="mt-2 font-display text-[clamp(2.5rem,5.8vw,4.25rem)] font-black leading-[0.88] tracking-[-0.045em] text-ink">
                    What if X
                    <br />
                    built Y?
                  </h1>
                </div>
              </>
            ) : (
              <>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  One prompt. Infinite timelines.
                </p>
                <h1 className="mt-2 font-display text-[clamp(2.5rem,5.8vw,4.25rem)] font-black leading-[0.88] tracking-[-0.045em] text-ink lg:text-[clamp(2.75rem,6vw,4.75rem)]">
                  What if X
                  <br />
                  built Y?
                </h1>
              </>
            )}
          </div>

          {phase === "error" && error ? (
            <p className="mb-2 shrink-0 text-xs font-medium text-barrier" role="alert">
              {error}
            </p>
          ) : null}

          {phase === "loading" && (
            <div className="mb-3 min-h-0 shrink lg:hidden">
              <PaperGeneratingPanel
                key={`${currentInputs.builder}-${currentInputs.target}-m`}
                compact
                inputs={currentInputs}
              />
            </div>
          )}

          <div
            className={cn(
              "mt-auto flex min-h-0 w-full flex-col pt-4",
              phase === "loading" ? "pointer-events-none opacity-60" : "",
            )}
          >
            <GeneratorForm
              signedIn={signedIn}
              variant="paper"
              paperDensity="flush"
              companyOptions={companies}
              initialValues={
                phase === "error"
                  ? currentInputs
                  : {
                      builder: currentInputs.builder,
                      target: currentInputs.target,
                      extraDetails: currentInputs.extraDetails,
                    }
              }
              onGenerating={handleGenerating}
              onGenerated={handleGenerated}
              onError={handleError}
              onInsufficientCredits={handleInsufficientCredits}
              abortControlRef={abortGenRef}
            />
          </div>
        </div>

        <div className="hidden min-h-0 min-w-0 flex-1 flex-col gap-3 lg:flex">
          {phase === "loading" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <PaperGeneratingPanel
                key={`${currentInputs.builder}-${currentInputs.target}-d`}
                inputs={currentInputs}
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div
                className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-[20px] p-8 lg:p-10"
                style={{
                  backgroundImage:
                    "linear-gradient(145deg, oklab(96.9% -0.002 0.006) 0%, oklab(91.6% -0.0002 0.019) 100%)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle farthest-corner at 20% 30% in oklab, oklab(88.5% -0.016 0.181 / 15%) 0%, oklab(0% 0 0 / 0%) 40%), radial-gradient(circle farthest-corner at 80% 70% in oklab, oklab(65.4% 0.204 0.111 / 8%) 0%, oklab(0% 0 0 / 0%) 40%)",
                  }}
                />
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#999"
                  strokeWidth="1.5"
                  className="relative shrink-0 opacity-50"
                  aria-hidden
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <div className="relative flex max-w-[400px] flex-col items-center gap-1.5 text-center">
                  <p className="font-display text-[clamp(1.35rem,2.4vw,1.75rem)] font-black italic text-ink lg:text-[28px]">
                    Your mockup lives here.
                  </p>
                  <p className="text-[13px] leading-[145%] text-muted lg:text-[14px]">
                    Pick a builder and a target company, then hit Generate. We&apos;ll dream up the UI
                    for the timeline where this product shipped.
                  </p>
                </div>
              </div>

              {starters.length > 0 ? (
                <div ref={startersRef} id="starters" className="flex shrink-0 flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      Or try one of these
                    </p>
                    <button
                      type="button"
                      onClick={() => setShuffleKey((k) => k + 1)}
                      className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden
                      >
                        <path d="M21 12a9 9 0 0 1-9 9m0-18a9 9 0 0 1 9 9M3 12a9 9 0 0 1 9-9m0 18a9 9 0 0 1-9-9" />
                        <path d="m16 12-4-4-4 4M12 16V8" />
                      </svg>
                      Shuffle
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    {starters.map((s) => (
                      <Link
                        key={`${s.builder}×${s.target}-${shuffleKey}`}
                        href={starterHref(s)}
                        className="flex flex-col"
                      >
                        <div
                          className={cn(
                            "flex h-[76px] items-center justify-center rounded-[10px] bg-linear-to-br px-2 text-center lg:h-[84px]",
                            s.swatchClass,
                          )}
                        >
                          <span
                            className={cn(
                              "font-display text-[12px] font-black italic leading-tight lg:text-[13px]",
                              s.labelClass,
                            )}
                          >
                            {s.label}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {phase === "loading" ? (
        <MobileGeneratingDock
          onCancel={() => {
            abortGenRef.current?.();
            setPhase("input");
            clearGenerating();
          }}
        />
      ) : null}

      <CreditsModal open={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </>
  );
}
