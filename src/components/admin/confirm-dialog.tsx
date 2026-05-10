"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui";

type ConfirmDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
};

/**
 * Modal confirmation dialog for destructive actions (delete company, screenshot, logo).
 * Identifies the target by name and requires explicit confirmation.
 *
 * Validates: Requirements 5.2
 */
export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the cancel button when the dialog opens
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  // Escape key to cancel
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-line bg-canvas p-6 shadow-lg">
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-ink"
        >
          {title}
        </h2>

        <p
          id="confirm-dialog-message"
          className="mt-2 text-sm text-muted"
        >
          {message}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            ref={cancelRef}
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="ink"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800"
          >
            {loading ? "Deleting…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
