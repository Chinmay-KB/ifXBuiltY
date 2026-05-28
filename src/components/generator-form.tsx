"use client";

import type { MutableRefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { ProductPickerSheet } from "@/components/product-picker/product-picker-sheet";
import { ProfilePickerTrigger } from "@/components/product-picker/profile-picker-trigger";
import { ScreenTypePopover } from "@/components/product-picker/screen-type-popover";
import { useSignInModal } from "@/components/sign-in-modal-provider";
import { Button, MicroLabel, Surface } from "@/components/ui";
import type {
  GeneratorProfileGroup,
  GeneratorProfileOption,
} from "@/data/generator-profile-options";
import {
  buildGeneratorProfileGroups,
  profileById,
  resolveProfileIdByName,
} from "@/data/generator-profile-options";
import { FLAT_OPTIONS } from "@/data/generator-options";
import { useGenerate } from "@/hooks/use-generate";
import { cn } from "@/lib/cn";
import {
  normalizeRenderMode,
  type RenderMode,
} from "@/lib/screen-type";
import { isGenerateEnabled } from "@/lib/ui/format";
import type {
  GenerationInputs,
  GenerationResult,
  RemixSource,
} from "@/lib/ui/types";

export type GeneratorCompanyOption = { id: string; name: string };

type GeneratorFormProps = {
  signedIn: boolean;
  initialValues?: Partial<GenerationInputs>;
  remixSource?: RemixSource | null;
  onGenerated: (result: GenerationResult) => void;
  onGenerating?: (inputs: GenerationInputs) => void;
  onError?: (error: string, inputs: GenerationInputs) => void;
  onInsufficientCredits?: () => void;
  /** Paper Desktop Generate (v2) chrome */
  variant?: "default" | "paper";
  /** Tighter Paper layout to fit one viewport (Generate page) */
  paperDensity?: "comfortable" | "flush";
  /** Grouped company/product options from Supabase */
  profileGroups?: GeneratorProfileGroup[];
  /** @deprecated Use profileGroups */
  companyOptions?: GeneratorCompanyOption[];
  /** Parent can call `abortControlRef.current?.()` to cancel the in-flight `/api/generate` request */
  abortControlRef?: MutableRefObject<(() => void) | null>;
};

const defaults: GenerationInputs = {
  builder: "",
  target: "",
  extraDetails: "",
  screenType: "desktop",
};

const FALLBACK_SCREEN = "desktop" as const;

export function GeneratorForm({
  signedIn,
  initialValues,
  remixSource,
  onGenerated,
  onGenerating,
  onError,
  onInsufficientCredits,
  variant = "default",
  paperDensity = "comfortable",
  profileGroups,
  companyOptions,
  abortControlRef,
}: GeneratorFormProps) {
  const { openSignIn } = useSignInModal();
  const merged = { ...defaults, ...initialValues };

  const groups = useMemo((): GeneratorProfileGroup[] =>
      profileGroups ??
      (companyOptions
        ? [
            {
              companyId: "_flat",
              companyName: "All",
              options: companyOptions.map((o) => ({
                id: o.id,
                name: o.name,
                profileType: "company" as const,
                parentCompanyId: null,
                category: "",
                screenType: FALLBACK_SCREEN,
              })),
            },
          ]
        : [
            {
              companyId: "_catalog",
              companyName: "Companies & products",
              options: Array.from(
                new Map(
                  FLAT_OPTIONS.map((o) => [
                    o.id,
                    {
                      id: o.id,
                      name: o.name,
                      profileType: "company" as const,
                      parentCompanyId: null,
                      category: "",
                      screenType: FALLBACK_SCREEN,
                    },
                  ]),
                ).values(),
              ),
            },
          ]),
    [profileGroups, companyOptions],
  );

  const idMap = useMemo(() => profileById(groups), [groups]);

  const [builderId, setBuilderId] = useState(
    merged.builderId ?? resolveProfileIdByName(merged.builder, groups) ?? "",
  );
  const [targetId, setTargetId] = useState(
    merged.targetId ?? resolveProfileIdByName(merged.target, groups) ?? "",
  );
  const [extraDetails, setExtraDetails] = useState(merged.extraDetails);
  const [pickerField, setPickerField] = useState<null | "builder" | "target">(null);
  const [screenType, setScreenType] = useState<RenderMode>(() =>
    normalizeRenderMode(merged.screenType ?? FALLBACK_SCREEN),
  );
  const [screenTypeOverridden, setScreenTypeOverridden] = useState(
    Boolean(merged.screenType),
  );
  const [screenTypePopoverOpen, setScreenTypePopoverOpen] = useState(false);
  const builderTriggerRef = useRef<HTMLButtonElement>(null);
  const targetTriggerRef = useRef<HTMLButtonElement>(null);
  const screenTypeRowRef = useRef<HTMLDivElement>(null);

  const builderOption = idMap.get(builderId);
  const targetOption = idMap.get(targetId);
  const builder = builderOption?.name ?? merged.builder;
  const target = targetOption?.name ?? merged.target;
  const builderScreenDefault = normalizeRenderMode(
    builderOption?.screenType ?? FALLBACK_SCREEN,
  );

  useEffect(() => {
    if (!merged.builder || builderId) return;
    const id = resolveProfileIdByName(merged.builder, groups);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) setBuilderId(id);
  }, [merged.builder, builderId, groups]);

  useEffect(() => {
    if (!merged.target || targetId) return;
    const id = resolveProfileIdByName(merged.target, groups);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) setTargetId(id);
  }, [merged.target, targetId, groups]);

  const { generate, cancelInflight, result, isLoading, error, errorCode } = useGenerate();

  useLayoutEffect(() => {
    if (!abortControlRef) return;
    abortControlRef.current = cancelInflight;
    return () => {
      abortControlRef.current = null;
    };
  }, [abortControlRef, cancelInflight]);

  const canGenerate = isGenerateEnabled(builderId, targetId);
  const flushPaper = variant === "paper" && paperDensity === "flush";

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
    if (result?.id && result.slug) {
      onGeneratedRef.current(result);
    }
  }, [result]);

  useEffect(() => {
    if (error) {
      if (errorCode === "insufficient_credits") {
        onInsufficientCreditsRef.current?.();
        return;
      }
      const inputs: GenerationInputs = {
        builder,
        target,
        builderId: builderId || undefined,
        targetId: targetId || undefined,
        extraDetails,
        screenType,
      };
      onErrorRef.current?.(error, inputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, errorCode]);

  const handleSubmit = useCallback(async () => {
    const inputs: GenerationInputs = {
      builder,
      target,
      builderId: builderId || undefined,
      targetId: targetId || undefined,
      extraDetails,
      screenType,
    };
    onGeneratingRef.current?.(inputs);
    await generate(inputs, remixSource?.id ? { remixParentId: remixSource.id } : undefined);
  }, [builder, target, builderId, targetId, extraDetails, screenType, generate, remixSource]);

  const handlePickerSelect = (option: GeneratorProfileOption) => {
    if (pickerField === "builder") {
      setBuilderId(option.id);
      if (!screenTypeOverridden) {
        setScreenType(normalizeRenderMode(option.screenType));
      }
    } else if (pickerField === "target") {
      setTargetId(option.id);
    }
    setPickerField(null);
  };

  const pickerReturnFocusRef =
    pickerField === "builder"
      ? builderTriggerRef
      : pickerField === "target"
        ? targetTriggerRef
        : undefined;

  const pickerSheet = (
    <ProductPickerSheet
      open={pickerField !== null}
      field={pickerField ?? "builder"}
      groups={groups}
      valueId={pickerField === "target" ? targetId : builderId}
      onClose={() => setPickerField(null)}
      onSelect={handlePickerSelect}
      returnFocusRef={pickerReturnFocusRef}
    />
  );

  const builderField = (
    <div className="relative flex flex-col gap-2">
      <ProfilePickerTrigger
        id="gen-builder"
        field="builder"
        prefix="If"
        groups={groups}
        valueId={builderId}
        selected={builderOption}
        open={pickerField === "builder"}
        variant={variant === "paper" ? "paper" : "default"}
        onOpen={() => setPickerField("builder")}
        triggerRef={builderTriggerRef}
        screenType={screenType}
        screenTypeDefault={builderScreenDefault}
        onChangeScreenType={() => setScreenTypePopoverOpen(true)}
        screenTypeRowRef={screenTypeRowRef}
      />
      <ScreenTypePopover
        open={screenTypePopoverOpen}
        value={screenType}
        defaultValue={builderScreenDefault}
        onClose={() => setScreenTypePopoverOpen(false)}
        onChange={(v) => {
          setScreenType(v);
          setScreenTypeOverridden(true);
        }}
        anchorRef={screenTypeRowRef}
      />
    </div>
  );

  const targetField = (
    <ProfilePickerTrigger
      id="gen-target"
      field="target"
      prefix={variant === "paper" ? "built" : "Target"}
      groups={groups}
      valueId={targetId}
      selected={targetOption}
      open={pickerField === "target"}
      variant={variant === "paper" ? "paper" : "default"}
      onOpen={() => setPickerField("target")}
      triggerRef={targetTriggerRef}
    />
  );

  const inner = (
    <>
      {variant === "paper" ? (
        <>
          <div className={cn("flex flex-col", flushPaper ? "gap-3" : "gap-4")}>
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Builder (the who)
              </p>
              {builderField}
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Target (the what)
              </p>
              {targetField}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <MicroLabel htmlFor="gen-extra">Extra details (optional)</MicroLabel>
            <label className="flex min-h-[80px] flex-col rounded-[10px] border-2 border-line-strong bg-panel p-3">
              <textarea
                id="gen-extra"
                value={extraDetails}
                onChange={(e) => setExtraDetails(e.target.value)}
                rows={3}
                placeholder="Add specific jokes, references, or details…"
                className="w-full resize-none bg-transparent text-sm leading-snug text-ink outline-none placeholder:text-muted/50"
              />
            </label>
          </div>

          {signedIn ? (
            <button
              type="button"
              disabled={!canGenerate || isLoading}
              onClick={() => void handleSubmit()}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-4 font-display text-[22px] font-black italic tracking-tight text-chrome transition-opacity disabled:opacity-40"
            >
              {isLoading ? "Generating…" : "Generate"}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 text-chrome"
                aria-hidden
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={openSignIn}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-ink px-6 py-4 font-display text-[22px] font-black italic text-chrome"
            >
              Sign in to generate
            </button>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <MicroLabel htmlFor="gen-builder">Builder (the who)</MicroLabel>
              {builderField}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <MicroLabel htmlFor="gen-target">Target (the what)</MicroLabel>
              {targetField}
            </div>
          </div>

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
        </>
      )}

      {error && (
        <p className="text-sm font-medium text-barrier" role="alert">
          {error}
        </p>
      )}
    </>
  );

  if (variant === "paper") {
    return (
      <div
        className={cn(
          "flex w-full flex-col",
          flushPaper ? "min-h-0 max-w-none flex-1 gap-6" : "max-w-[560px] gap-8",
        )}
      >
        {inner}
        {pickerSheet}
      </div>
    );
  }

  return (
    <Surface variant="composer" className="flex flex-col gap-4">
      {inner}
      {pickerSheet}
    </Surface>
  );
}
