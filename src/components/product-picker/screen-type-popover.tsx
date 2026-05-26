"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";
import {
  formatScreenLabel,
  normalizeRenderMode,
  RENDER_MODE_OPTIONS,
  type RenderMode,
} from "@/lib/screen-type";

type ScreenTypePopoverProps = {
  open: boolean;
  value: RenderMode;
  defaultValue: RenderMode;
  onClose: () => void;
  onChange: (value: RenderMode) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
};

const OPTION_ICONS: Record<RenderMode, string> = {
  mobile: "📱",
  desktop: "🖥",
};

const OPTION_HINTS: Record<RenderMode, string> = {
  mobile: "9:16 portrait",
  desktop: "16:9 widescreen",
};

export function ScreenTypePopover({
  open,
  value,
  defaultValue,
  onClose,
  onChange,
  anchorRef,
}: ScreenTypePopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="listbox"
      aria-label="Screen format"
      className="absolute left-0 top-full z-20 mt-2 w-full min-w-[280px] max-w-[320px] rounded-xl border border-ink bg-canvas p-4 shadow-modal"
    >
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        Screen format
      </p>
      <div className="flex flex-col gap-1">
        {RENDER_MODE_OPTIONS.map((opt) => {
          const active = normalizeRenderMode(value) === opt;
          const isDefault = normalizeRenderMode(defaultValue) === opt;
          return (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                onChange(opt);
                onClose();
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] transition-colors",
                active ? "bg-chrome font-semibold text-ink" : "text-ink hover:bg-panel",
              )}
            >
              <span className="text-base" aria-hidden>
                {OPTION_ICONS[opt]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block">{formatScreenLabel(opt)}</span>
                <span className="font-mono text-[10px] font-normal uppercase tracking-wide text-muted">
                  {OPTION_HINTS[opt]}
                </span>
              </span>
              {isDefault ? (
                <span className="font-mono text-[9px] font-bold uppercase tracking-wide text-muted">
                  Default
                </span>
              ) : null}
              {active ? (
                <span className="font-mono text-[9px] font-bold uppercase tracking-wide text-ink">
                  Active
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
