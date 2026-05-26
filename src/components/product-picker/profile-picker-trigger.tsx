"use client";

import type {
  GeneratorProfileGroup,
  GeneratorProfileOption,
} from "@/data/generator-profile-options";
import { cn } from "@/lib/cn";
import { formatScreenLabel, normalizeRenderMode, type RenderMode } from "@/lib/screen-type";

import { companyNameForOption } from "./utils";

type ProfilePickerTriggerProps = {
  id: string;
  field: "builder" | "target";
  prefix: string;
  groups: GeneratorProfileGroup[];
  valueId: string;
  selected: GeneratorProfileOption | undefined;
  open: boolean;
  variant: "paper" | "default";
  onOpen: () => void;
  /** Builder only: screen type row */
  screenType?: RenderMode;
  screenTypeDefault?: RenderMode;
  onChangeScreenType?: () => void;
  screenTypeRowRef?: React.RefObject<HTMLDivElement | null>;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
};

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 7h16M4 12h16M4 17h10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProfilePickerTrigger({
  id,
  field,
  prefix,
  groups,
  valueId,
  selected,
  open,
  variant,
  onOpen,
  screenType,
  screenTypeDefault,
  onChangeScreenType,
  screenTypeRowRef,
  triggerRef,
}: ProfilePickerTriggerProps) {
  const isPaper = variant === "paper";
  const hasValue = Boolean(valueId && selected);
  const companyLabel = selected
    ? companyNameForOption(groups, selected)
    : "";
  const displayName = selected?.name ?? "";
  const placeholder = "Pick a company or product";

  const normalizedName = displayName.toLowerCase();
  const normalizedCompany = companyLabel.toLowerCase();
  const showCompanyContext = Boolean(
    selected &&
      selected.profileType === "product" &&
      companyLabel &&
      !normalizedName.startsWith(normalizedCompany) &&
      !normalizedName.includes(normalizedCompany),
  );

  const showScreenRow =
    field === "builder" && hasValue && screenType && onChangeScreenType;

  if (isPaper) {
    return (
      <div className="flex flex-col gap-2">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex w-full items-baseline gap-3.5 rounded-[14px] bg-panel py-3.5 pl-5 pr-4 text-left transition-opacity"
        >
          <span className="font-display text-[32px] font-black italic leading-none text-ink">
            {prefix}
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 truncate font-display text-[20px] font-medium italic leading-[1.15] tracking-[-0.02em]",
              hasValue ? "text-ink" : "text-muted",
            )}
          >
            {hasValue ? displayName : placeholder}
            {showCompanyContext ? (
              <span className="ml-2 align-middle font-mono text-[10px] font-bold not-italic uppercase tracking-[0.18em] text-muted">
                · {companyLabel}
              </span>
            ) : null}
          </span>
          <ListIcon className="shrink-0 text-ink" />
        </button>
        {showScreenRow ? (
          <div
            ref={screenTypeRowRef}
            className="relative flex items-center justify-between rounded-[14px] border border-line bg-canvas px-5 py-3"
          >
            <p className="text-sm text-muted">
              Default screen —{" "}
              <span className="font-medium text-ink">
                {formatScreenLabel(screenType)}
              </span>
            </p>
            <button
              type="button"
              onClick={onChangeScreenType}
              className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink underline-offset-2 hover:underline"
            >
              Change
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full min-h-[44px] items-center justify-between gap-2 rounded-[10px] border-2 border-line-strong bg-panel px-3 py-2.5 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">
          {hasValue ? (
            <>
              <span className="text-muted">{companyLabel} — </span>
              {displayName}
            </>
          ) : (
            <span className="text-muted">Select company or product…</span>
          )}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-muted"
          aria-hidden
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {showScreenRow ? (
        <div
          ref={screenTypeRowRef}
          className="relative flex items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2"
        >
          <p className="text-xs text-muted">
            Default screen —{" "}
            <span className="font-medium text-ink">
              {formatScreenLabel(screenType)}
            </span>
            {screenTypeDefault &&
            normalizeRenderMode(screenType) !==
              normalizeRenderMode(screenTypeDefault) ? (
              <span className="text-muted"> (overridden)</span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={onChangeScreenType}
            className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink"
          >
            Change
          </button>
        </div>
      ) : null}
    </div>
  );
}
