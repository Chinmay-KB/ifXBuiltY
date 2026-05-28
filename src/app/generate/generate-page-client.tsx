"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CreditsModal } from "@/components/credits-modal";
import { GeneratorForm } from "@/components/generator-form";
import type { GeneratorProfileGroup } from "@/data/generator-profile-options";
import { flattenGeneratorProfileGroups } from "@/data/generator-profile-options";
import { useNavigationGenerating } from "@/components/navigation-generating-context";
import { useCredits } from "@/hooks/use-credits";
import { useGenerationStatus } from "@/hooks/use-generation-status";
import {
  clearActiveGenerationId,
  saveActiveGenerationId,
} from "@/lib/generation/active-generation-storage";
import { cn } from "@/lib/cn";
import type { GenerationInputs, GenerationResult } from "@/lib/ui/types";

const PromptComposition = dynamic(
  () => import("./generating-ui").then((m) => m.PromptComposition),
  { ssr: false },
);
const PaperGeneratingPanel = dynamic(
  () => import("./generating-ui").then((m) => m.PaperGeneratingPanel),
  { ssr: false },
);
const MobileGeneratingDock = dynamic(
  () => import("./generating-ui").then((m) => m.MobileGeneratingDock),
  { ssr: false },
);

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

function buildCompanyPairPool(
  profileGroups: GeneratorProfileGroup[],
): { builder: string; target: string }[] {
  const options = flattenGeneratorProfileGroups(profileGroups);
  if (options.length < 2) return [];
  const pairs: { builder: string; target: string }[] = [];
  for (let i = 0; i < options.length; i++) {
    for (let j = 0; j < options.length; j++) {
      if (i === j) continue;
      pairs.push({
        builder: options[i]!.name,
        target: options[j]!.name,
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

type Phase = "input" | "loading" | "error";

const defaultInputs: GenerationInputs = {
  builder: "",
  target: "",
  extraDetails: "",
};

type GeneratePageClientProps = {
  signedIn: boolean;
  initialBuilder?: string;
  initialTarget?: string;
  profileGroups: GeneratorProfileGroup[];
};

export function GeneratePageClient({
  signedIn,
  initialBuilder,
  initialTarget,
  profileGroups,
}: GeneratePageClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [currentInputs, setCurrentInputs] = useState<GenerationInputs>({
    ...defaultInputs,
    builder: initialBuilder ?? "",
    target: initialTarget ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [resumeChecked, setResumeChecked] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<{
    id: number;
    slug: string;
  } | null>(null);

  const startersRef = useRef<HTMLDivElement | null>(null);
  const abortGenRef = useRef<(() => void) | null>(null);
  const { refresh: refreshCredits } = useCredits(signedIn);
  const { setGenerating, clearGenerating } = useNavigationGenerating();

  const submittedInputsRef = useRef<GenerationInputs>(defaultInputs);

  const finishGeneration = useCallback(
    (slug: string) => {
      clearActiveGenerationId();
      setPendingGeneration(null);
      void refreshCredits();
      router.push(`/g/${slug}`);
    },
    [refreshCredits, router],
  );

  useGenerationStatus({
    generationId: pendingGeneration?.id ?? 0,
    enabled: Boolean(pendingGeneration),
    onCompleted: (payload) => {
      finishGeneration(payload.slug);
    },
    onFailed: (payload) => {
      clearActiveGenerationId();
      setPendingGeneration(null);
      setError(payload.errorMessage ?? "Generation failed");
      setPhase("error");
    },
  });

  useEffect(() => {
    if (!signedIn || resumeChecked) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/generations/latest-in-progress");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const item = data.item as {
          slug?: string;
          id?: number;
          builder?: string;
          target?: string;
        } | null;
        if (item?.slug && item.id) {
          saveActiveGenerationId(item.id);
          setPendingGeneration({ id: item.id, slug: item.slug });
          setCurrentInputs((prev) => ({
            ...prev,
            builder: item.builder ?? prev.builder,
            target: item.target ?? prev.target,
          }));
          setPhase("loading");
          return;
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setResumeChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn, resumeChecked]);

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
    const pool = buildCompanyPairPool(profileGroups);
    if (pool.length === 0) return [];
    const shuffled = shuffle(pool, shuffleKey);
    return shuffled.slice(0, 4).map((p, i) => pairToStarter(p, i));
  }, [profileGroups, shuffleKey]);

  const handleGenerating = useCallback((inputs: GenerationInputs) => {
    submittedInputsRef.current = inputs;
    setCurrentInputs(inputs);
    setPhase("loading");
    setError(null);
  }, []);

  const handleGenerated = useCallback((result: GenerationResult) => {
    saveActiveGenerationId(result.id);
    setPendingGeneration({ id: result.id, slug: result.slug });
    // Stay on loading UI until status polling reports completed.
  }, []);

  const handleError = useCallback((errorMsg: string, inputs: GenerationInputs) => {
    setError(errorMsg);
    setCurrentInputs(inputs);
    setPhase("error");
  }, []);

  const handleInsufficientCredits = useCallback(() => {
    setPhase("input");
    setShowCreditsModal(true);
  }, []);

  if (!resumeChecked && signedIn) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Checking for in-progress generations…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex w-full flex-1 min-h-0 flex-col px-4 py-2 sm:px-8 md:px-10 lg:flex-row lg:gap-10 lg:px-16 lg:py-4">
        <div
          className={cn(
            "flex min-h-0 w-full min-w-0 flex-1 flex-col lg:max-w-[560px] lg:shrink-0",
            phase === "loading" ? "lg:justify-center" : "",
          )}
        >
          <div
            className={cn(
              "shrink-0 lg:mb-2",
              phase === "loading" ? "lg:-translate-y-6" : "",
            )}
          >
            {phase === "loading" ? (
              <PromptComposition
                builder={currentInputs.builder}
                target={currentInputs.target}
              />
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
              phase === "loading"
                ? "pointer-events-none opacity-50 lg:hidden"
                : "",
            )}
          >
            <GeneratorForm
              signedIn={signedIn}
              variant="paper"
              paperDensity="flush"
              profileGroups={profileGroups}
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
            <div className="flex w-full min-w-0 flex-col">
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
            setPendingGeneration(null);
            setPhase("input");
            clearGenerating();
          }}
        />
      ) : null}

      <CreditsModal open={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </>
  );
}
