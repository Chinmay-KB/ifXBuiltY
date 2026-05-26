"use client";

import { useCallback, useEffect, useId, useRef } from "react";

import type {
  GeneratorProfileGroup,
  GeneratorProfileOption,
} from "@/data/generator-profile-options";
import { cn } from "@/lib/cn";

import { ProductPickerBody } from "./product-picker-body";
import { pickerTitle } from "./utils";

export type ProductPickerSheetProps = {
  open: boolean;
  field: "builder" | "target";
  groups: GeneratorProfileGroup[];
  valueId: string;
  onClose: () => void;
  onSelect: (option: GeneratorProfileOption) => void;
  /** Element to restore focus after close */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

export function ProductPickerSheet({
  open,
  field,
  groups,
  valueId,
  onClose,
  onSelect,
  returnFocusRef,
}: ProductPickerSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (option: GeneratorProfileOption) => {
      onSelect(option);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleClose = useCallback(() => {
    onClose();
    requestAnimationFrame(() => {
      returnFocusRef?.current?.focus();
    });
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = panelRef.current?.querySelector<HTMLInputElement>(
          'input[type="search"]',
        );
        input?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    first?.focus();
  }, [open]);

  if (!open) return null;

  const { label } = pickerTitle(field);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 md:items-center md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "flex max-h-[100dvh] w-full flex-col overflow-hidden bg-canvas shadow-modal",
          "max-md:min-h-[90dvh] max-md:rounded-t-3xl",
          "md:max-h-[min(780px,85vh)] md:max-w-[1100px] md:rounded-[20px] md:border md:border-ink",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3 md:hidden">
          <button
            type="button"
            onClick={handleClose}
            className="flex size-9 items-center justify-center rounded-full bg-panel text-ink"
            aria-label="Close picker"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <p
            id={titleId}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-ink"
          >
            {label}
          </p>
          <span className="size-9" aria-hidden />
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 z-10 hidden size-10 items-center justify-center rounded-full bg-panel text-ink md:flex"
          aria-label="Close picker"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <ProductPickerBody
          field={field}
          groups={groups}
          valueId={valueId}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
