"use client";

import { useCallback, useRef, useState } from "react";

import { GenerationLoadingState } from "@/components/generation-loading-state";
import { GenerationResultView } from "@/components/generation-result-view";
import { GeneratorForm } from "@/components/generator-form";
import { SHOWCASE_EXAMPLES } from "@/data/showcase-examples";
import type { GenerationInputs, GenerationResult } from "@/lib/ui/types";

type Phase = "input" | "loading" | "result" | "error";

const defaultInputs: GenerationInputs = {
  builder: "",
  target: "",
  tone: "satirical",
  screenType: "mobile app",
  region: "global",
  extraDetails: "",
};

type GeneratePageClientProps = {
  signedIn: boolean;
};

export function GeneratePageClient({ signedIn }: GeneratePageClientProps) {
  const [phase, setPhase] = useState<Phase>("input");
  const [currentInputs, setCurrentInputs] =
    useState<GenerationInputs>(defaultInputs);
  const [lastInputs, setLastInputs] = useState<GenerationInputs>(defaultInputs);
  const [generationResult, setGenerationResult] =
    useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track the inputs that were submitted for the current generation
  const submittedInputsRef = useRef<GenerationInputs>(defaultInputs);

  // Called when the form starts generating — transition to loading phase
  const handleGenerating = useCallback((inputs: GenerationInputs) => {
    submittedInputsRef.current = inputs;
    setCurrentInputs(inputs);
    setPhase("loading");
    setError(null);
  }, []);

  // Called when generation completes successfully
  const handleGenerated = useCallback((result: GenerationResult) => {
    setGenerationResult(result);
    setLastInputs(submittedInputsRef.current);
    setPhase("result");
  }, []);

  // Called when generation fails — show form with error
  const handleError = useCallback(
    (errorMsg: string, inputs: GenerationInputs) => {
      setError(errorMsg);
      setCurrentInputs(inputs);
      setPhase("error");
    },
    [],
  );

  // Reset to input phase with cleared form
  const handleReset = useCallback(() => {
    setPhase("input");
    setGenerationResult(null);
    setError(null);
    setCurrentInputs(defaultInputs);
    setLastInputs(defaultInputs);
  }, []);

  // Regenerate with updated inputs — go through the full flow again
  const handleRegenerate = useCallback(async (inputs: GenerationInputs) => {
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
    } catch {
      setError("Network error. Please check your connection and try again.");
      setPhase("error");
    }
  }, []);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-12 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            Generate
          </h1>
          <p className="mt-2 text-base text-muted">
            Pick a builder and a target, then let it overthink the interface.
          </p>
        </div>

        {/* Phase: input or error (show form with error preserved) */}
        {(phase === "input" || phase === "error") && (
          <GeneratorForm
            signedIn={signedIn}
            initialValues={phase === "error" ? currentInputs : undefined}
            onGenerating={handleGenerating}
            onGenerated={handleGenerated}
            onError={handleError}
          />
        )}

        {/* Phase: loading — show engagement content */}
        {phase === "loading" && (
          <GenerationLoadingState showcaseExamples={SHOWCASE_EXAMPLES} />
        )}

        {/* Phase: result — show the generated image and actions */}
        {phase === "result" && generationResult && (
          <GenerationResultView
            result={generationResult}
            currentInputs={currentInputs}
            lastInputs={lastInputs}
            onReset={handleReset}
            onRegenerate={handleRegenerate}
          />
        )}
      </div>
    </div>
  );
}
