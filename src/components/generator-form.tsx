"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button, FieldShell, MicroLabel, Surface } from "@/components/ui";
import { useGenerate } from "@/hooks/use-generate";
import { cn } from "@/lib/cn";
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
};

const defaults: GenerationInputs = {
  builder: "",
  target: "",
  tone: "satirical",
  screenType: "mobile app",
  region: "global",
  extraDetails: "",
};

const TONE_OPTIONS = ["satirical", "absurdly polished", "dead serious", "unhinged"] as const;
const SCREEN_OPTIONS = ["mobile app", "desktop web", "kiosk"] as const;
const REGION_OPTIONS = ["global", "US", "EU", "Global south"] as const;

export function GeneratorForm({
  signedIn,
  initialValues,
  remixSource,
  onGenerated,
  onGenerating,
  onError,
}: GeneratorFormProps) {
  const merged = { ...defaults, ...initialValues };

  const [builder, setBuilder] = useState(merged.builder);
  const [target, setTarget] = useState(merged.target);
  const [tone, setTone] = useState(merged.tone);
  const [screenType, setScreenType] = useState(merged.screenType);
  const [region, setRegion] = useState(merged.region);
  const [extraDetails, setExtraDetails] = useState(merged.extraDetails);

  const { generate, result, isLoading, error } = useGenerate();

  const canGenerate = isGenerateEnabled(builder, target);

  // Notify parent when a result arrives
  const onGeneratedRef = useRef(onGenerated);
  onGeneratedRef.current = onGenerated;

  const onGeneratingRef = useRef(onGenerating);
  onGeneratingRef.current = onGenerating;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (result) {
      onGeneratedRef.current(result);
    }
  }, [result]);

  useEffect(() => {
    if (error) {
      const inputs: GenerationInputs = {
        builder,
        target,
        tone,
        screenType,
        region,
        extraDetails,
      };
      onErrorRef.current?.(error, inputs);
    }
    // Only fire when error changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const handleSubmit = useCallback(async () => {
    const inputs: GenerationInputs = {
      builder,
      target,
      tone,
      screenType,
      region,
      extraDetails,
    };
    onGeneratingRef.current?.(inputs);
    await generate(inputs, remixSource?.id ? { remixParentId: remixSource.id } : undefined);
  }, [builder, target, tone, screenType, region, extraDetails, generate, remixSource]);

  return (
    <Surface variant="composer" className="flex flex-col gap-4">
      {/* Remix attribution strip */}
      {remixSource && (
        <div className="flex items-center gap-3 rounded-lg bg-panel px-3 py-2">
          {remixSource.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={remixSource.imageUrl}
              alt=""
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

      {/* Primary inputs — Builder and Target */}
      <div className="flex flex-col gap-4 md:flex-row md:gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <MicroLabel htmlFor="gen-builder">Builder</MicroLabel>
          <FieldShell>
            <input
              id="gen-builder"
              type="text"
              value={builder}
              onChange={(e) => setBuilder(e.target.value)}
              placeholder="e.g. Duolingo"
              className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-muted/50"
              autoComplete="off"
            />
          </FieldShell>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <MicroLabel htmlFor="gen-target">Target</MicroLabel>
          <FieldShell>
            <input
              id="gen-target"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. airport security"
              className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-muted/50"
              autoComplete="off"
            />
          </FieldShell>
        </div>
      </div>

      {/* Secondary controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <MicroLabel htmlFor="gen-tone">Tone</MicroLabel>
            <FieldShell size="md">
              <select
                id="gen-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <MicroLabel htmlFor="gen-screen-type">Screen type</MicroLabel>
            <FieldShell size="md">
              <select
                id="gen-screen-type"
                value={screenType}
                onChange={(e) => setScreenType(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
              >
                {SCREEN_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <MicroLabel htmlFor="gen-region">Region</MicroLabel>
            <FieldShell size="md">
              <select
                id="gen-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
              >
                {REGION_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <MicroLabel htmlFor="gen-extra">Extra details</MicroLabel>
          <label className="flex min-h-[80px] flex-col rounded-lg border border-line-strong bg-canvas p-3">
            <textarea
              id="gen-extra"
              value={extraDetails}
              onChange={(e) => setExtraDetails(e.target.value)}
              rows={3}
              placeholder="Any extra directions for the generation..."
              className="w-full resize-none bg-transparent text-sm leading-snug text-ink outline-none placeholder:text-muted/50"
            />
          </label>
        </div>
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
        <Link
          href="/login"
          className={cn(
            "inline-flex w-full items-center justify-center rounded-lg border-2 border-ink bg-chrome px-4 py-3.5 text-base font-black text-ink transition-[background-color,filter,color]",
            "hover:brightness-[0.98] active:brightness-95",
          )}
        >
          Sign in to generate
        </Link>
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
