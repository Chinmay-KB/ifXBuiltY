"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSignInModal } from "@/components/sign-in-modal-provider";
import { Button, FieldShell, MicroLabel, Surface } from "@/components/ui";
import { BUILDER_OPTIONS, TARGET_OPTIONS } from "@/data/generator-options";
import { useGenerate } from "@/hooks/use-generate";
import { cn } from "@/lib/cn";
import { REMIX_SOURCE_THUMB_SIZES } from "@/lib/generation-image-sizes";
import { isGenerateEnabled } from "@/lib/ui/format";
import type {
  GenerationInputs,
  GenerationResult,
  RemixSource,
} from "@/lib/ui/types";

type GeneratorFormProps = {
  signedIn: boolean;
  initialValues?: Partial<GenerationInputs>;
  remixSource?: RemixSource | null;
  onGenerated: (result: GenerationResult) => void;
  /** Called when generation starts — allows parent to show loading state */
  onGenerating?: (inputs: GenerationInputs) => void;
  /** Called when generation fails — allows parent to handle error phase */
  onError?: (error: string, inputs: GenerationInputs) => void;
  /** Called when the API returns insufficient_credits — parent shows modal */
  onInsufficientCredits?: () => void;
};

const defaults: GenerationInputs = {
  builder: "",
  target: "",
  extraDetails: "",
};

export function GeneratorForm({
  signedIn,
  initialValues,
  remixSource,
  onGenerated,
  onGenerating,
  onError,
  onInsufficientCredits,
}: GeneratorFormProps) {
  const { openSignIn } = useSignInModal();
  const merged = { ...defaults, ...initialValues };

  const [builder, setBuilder] = useState(merged.builder);
  const [target, setTarget] = useState(merged.target);
  const [extraDetails, setExtraDetails] = useState(merged.extraDetails);

  const { generate, result, isLoading, error, errorCode } = useGenerate();

  const canGenerate = isGenerateEnabled(builder, target);

  const onGeneratedRef = useRef(onGenerated);
  const onGeneratingRef = useRef(onGenerating);
  const onErrorRef = useRef(onError);
  const onInsufficientCreditsRef = useRef(onInsufficientCredits);

  useEffect(() => {
    onGeneratedRef.current = onGenerated;
    onGeneratingRef.current = onGenerating;
    onErrorRef.current = onError;
    onInsufficientCreditsRef.current = onInsufficientCredits;
  }, [onGenerated, onGenerating, onError, onInsufficientCredits]);

  useEffect(() => {
    if (result) {
      onGeneratedRef.current(result);
    }
  }, [result]);

  useEffect(() => {
    if (error) {
      // If insufficient credits, trigger the modal instead of showing inline error
      if (errorCode === "insufficient_credits") {
        onInsufficientCreditsRef.current?.();
        return;
      }
      const inputs: GenerationInputs = {
        builder,
        target,
        extraDetails,
      };
      onErrorRef.current?.(error, inputs);
    }
    // Only fire when error changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, errorCode]);

  const handleSubmit = useCallback(async () => {
    const inputs: GenerationInputs = {
      builder,
      target,
      extraDetails,
    };
    onGeneratingRef.current?.(inputs);
    await generate(inputs, remixSource?.id ? { remixParentId: remixSource.id } : undefined);
  }, [builder, target, extraDetails, generate, remixSource]);

  return (
    <Surface variant="composer" className="flex flex-col gap-4">
      {/* Remix attribution strip */}
      {remixSource && (
        <div className="flex items-center gap-3 rounded-lg bg-panel px-3 py-2">
          {remixSource.imageUrl && (
            <Image
              src={remixSource.imageUrl}
              alt=""
              width={40}
              height={40}
              sizes={REMIX_SOURCE_THUMB_SIZES}
              className="size-10 rounded object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted">Remixing from</p>
            <p className="truncate text-sm font-semibold text-ink">
              {remixSource.label}
            </p>
          </div>
        </div>
      )}

      {/* Primary inputs — Builder and Target dropdowns */}
      <div className="flex flex-col gap-4 md:flex-row md:gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <MicroLabel htmlFor="gen-builder">Builder (the who)</MicroLabel>
          <FieldShell>
            <select
              id="gen-builder"
              value={builder}
              onChange={(e) => setBuilder(e.target.value)}
              className="min-w-0 flex-1 appearance-none bg-transparent text-[15px] font-medium text-ink outline-none"
            >
              <option value="">Select a company...</option>
              {BUILDER_OPTIONS.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0 text-muted"
              aria-hidden="true"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </FieldShell>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <MicroLabel htmlFor="gen-target">Target (the what)</MicroLabel>
          <FieldShell>
            <select
              id="gen-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="min-w-0 flex-1 appearance-none bg-transparent text-[15px] font-medium text-ink outline-none"
            >
              <option value="">Select a product...</option>
              {TARGET_OPTIONS.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0 text-muted"
              aria-hidden="true"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </FieldShell>
        </div>
      </div>

      {/* Extra details (optional) */}
      <div className="flex flex-col gap-1.5">
        <MicroLabel htmlFor="gen-extra">Extra details (optional)</MicroLabel>
        <label className="flex min-h-[80px] flex-col rounded-[10px] border-2 border-line-strong bg-panel p-3">
          <textarea
            id="gen-extra"
            value={extraDetails}
            onChange={(e) => setExtraDetails(e.target.value)}
            rows={3}
            placeholder="Add specific jokes, references, or details you want included..."
            className="w-full resize-none bg-transparent text-sm leading-snug text-ink outline-none placeholder:text-muted/50"
          />
        </label>
      </div>

      {/* Generate button or sign-in prompt */}
      {signedIn ? (
        <Button
          variant="chrome"
          size="lg"
          className="w-full font-black"
          disabled={!canGenerate || isLoading}
          onClick={() => void handleSubmit()}
        >
          {isLoading ? "Generating…" : "Generate"}
        </Button>
      ) : (
        <button
          type="button"
          onClick={openSignIn}
          className={cn(
            "inline-flex w-full items-center justify-center rounded-lg border-2 border-ink bg-chrome px-4 py-3.5 text-base font-black text-ink transition-[background-color,filter,color]",
            "hover:brightness-[0.98] active:brightness-95",
          )}
        >
          Sign in to generate
        </button>
      )}

      {/* Inline error display */}
      {error && (
        <p className="text-sm font-medium text-barrier" role="alert">
          {error}
        </p>
      )}
    </Surface>
  );
}
