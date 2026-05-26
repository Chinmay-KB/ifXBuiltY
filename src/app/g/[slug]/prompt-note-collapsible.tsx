"use client";

import { useEffect, useId, useState } from "react";

type PromptNoteCollapsibleProps = {
  content: string;
};

export function PromptNoteCollapsible({ content }: PromptNoteCollapsibleProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative min-w-0 motion-safe:animate-detail-enter motion-safe:[animation-delay:280ms]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink underline-offset-2 transition-opacity hover:underline"
      >
        See the prompt
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4 py-8 backdrop-blur-[1px] motion-safe:animate-prompt-note-reveal"
          onClick={() => setOpen(false)}
        >
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Prompt note"
            className="w-full max-w-2xl rounded-2xl border border-line bg-canvas shadow-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                Prompt note
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-panel"
              >
                Close
              </button>
            </div>
            <div className="max-h-[min(65svh,560px)] overflow-y-auto px-5 py-4">
              <p className="wrap-break-word text-sm leading-relaxed text-muted-foreground">
                {content}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
