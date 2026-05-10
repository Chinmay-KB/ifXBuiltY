"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CreditsModal } from "@/components/credits-modal";
import { GenerationResultView } from "@/components/generation-result-view";
import { GeneratorForm } from "@/components/generator-form";
import { useCredits } from "@/hooks/use-credits";
import {
  getLoadingMessages,
  getAllFunFacts,
} from "@/data/loading-entertainment";
import type { GenerationInputs, GenerationResult } from "@/lib/ui/types";

/**
 * Loading state for the right preview panel.
 * Matches Paper design: dark area with dots + cycling message + progress bar + fun fact.
 */
function LoadingPreview({ builder }: { builder: string }) {
  const messages = getLoadingMessages(builder);
  const facts = useRef(getAllFunFacts(builder));
  const [msgIndex, setMsgIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(id);
  }, [messages.length]);

  // Cycle fun facts every 6 seconds
  useEffect(() => {
    if (facts.current.length <= 1) return;
    const id = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % facts.current.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Dark preview area */}
      <div className="flex flex-col items-center justify-center rounded-xl bg-ink px-10 py-20 gap-6">
        {/* Animated dots */}
        <div className="flex gap-1.5">
          <div className="size-2 rounded-full bg-chrome animate-pulse" />
          <div className="size-2 rounded-full bg-chrome animate-pulse opacity-60" style={{ animationDelay: "150ms" }} />
          <div className="size-2 rounded-full bg-chrome animate-pulse opacity-30" style={{ animationDelay: "300ms" }} />
        </div>

        {/* Cycling funny message */}
        <p className="text-center text-lg font-semibold text-white">
          {messages[msgIndex]}
        </p>

        {/* Subtitle */}
        <p className="text-sm text-white/40">
          This usually takes 15–30 seconds
        </p>

        {/* Progress bar */}
        <div className="h-1 w-80 max-w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 rounded-full bg-chrome animate-[indeterminate_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* While you wait — cycling fun facts */}
      {facts.current.length > 0 && (
        <div className="mx-4 mb-4 rounded-xl border border-line bg-canvas px-5 py-4">
          <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.04em] text-muted">
            While you wait
          </p>
          <p className="text-[14px] leading-relaxed text-ink">
            {facts.current[factIndex]}
          </p>
        </div>
      )}
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
};

export function GeneratePageClient({
  signedIn,
  initialBuilder,
  initialTarget,
}: GeneratePageClientProps) {
  const [phase, setPhase] = useState<Phase>("input");
  const [currentInputs, setCurrentInputs] = useState<GenerationInputs>({
    ...defaultInputs,
    builder: initialBuilder ?? "",
    target: initialTarget ?? "",
  });
  const [lastInputs, setLastInputs] = useState<GenerationInputs>(defaultInputs);
  const [generationResult, setGenerationResult] =
    useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  const { refresh: refreshCredits } = useCredits(signedIn);

  // Track the inputs that were submitted for the current generation
  const submittedInputsRef = useRef<GenerationInputs>(defaultInputs);

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
      // Refresh credits after successful generation
      void refreshCredits();
    },
    [refreshCredits],
  );

  const handleError = useCallback(
    (errorMsg: string, inputs: GenerationInputs) => {
      setError(errorMsg);
      setCurrentInputs(inputs);
      setPhase("error");
    },
    [],
  );

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
            (body as { error?: string }).error ||
            `Generation failed (${res.status})`;
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

  // Result phase uses a full-width centered layout instead of the two-panel split
  if (phase === "result" && generationResult) {
    return (
      <>
        <div className="flex flex-1 flex-col items-center px-4 py-8 sm:px-12 sm:py-10">
          <div className="w-full max-w-[860px]">
            <GenerationResultView
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
      <div className="flex flex-1 gap-8 px-4 py-8 sm:px-12 sm:py-10 lg:gap-10">
        {/* Left panel — Form */}
        <div className="w-full max-w-[480px] shrink-0">
          <div className="mb-6">
            <h1 className="font-display text-[32px] font-black tracking-tight text-ink">
              Cook something up
            </h1>
          </div>

          {phase === "error" && error ? (
            <p
              className="mb-4 text-sm font-medium text-barrier"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {/* Mobile loading indicator (right panel is hidden below lg) */}
          {phase === "loading" && (
            <div className="mb-4 lg:hidden">
              <LoadingPreview builder={currentInputs.builder} />
            </div>
          )}

          <div className={phase === "loading" ? "pointer-events-none opacity-60" : ""}>
            <GeneratorForm
              signedIn={signedIn}
              initialValues={
                phase === "error"
                  ? currentInputs
                  : { builder: currentInputs.builder, target: currentInputs.target }
              }
              onGenerating={handleGenerating}
              onGenerated={handleGenerated}
              onError={handleError}
              onInsufficientCredits={handleInsufficientCredits}
            />
          </div>
        </div>

        {/* Right panel — Preview (input/loading only) */}
        <div className="hidden flex-1 lg:flex">
          <div className="flex w-full flex-col rounded-2xl bg-panel p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              {phase === "loading" ? (
                <div className="flex items-center gap-2">
                  <div className="size-2 animate-pulse rounded-full bg-chrome" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
                    Generating...
                  </span>
                </div>
              ) : (
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
                  Preview
                </span>
              )}
            </div>

            {/* Preview area */}
            <div className="flex flex-1 items-center justify-center rounded-xl bg-ink">
              {phase === "loading" ? (
                <LoadingPreview builder={currentInputs.builder} />
              ) : (
                <div className="flex flex-col items-center gap-3 p-8">
                  <span className="text-[15px] font-medium text-white/40">
                    Your creation will appear here
                  </span>
                  <span className="text-[13px] text-white/25">
                    Hit generate to see the magic
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credits Modal */}
      <CreditsModal
        open={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
      />
    </>
  );
}
