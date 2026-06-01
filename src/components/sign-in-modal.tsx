"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { LogoMark, Wordmark } from "@/components/ui";

type Props = {
  open: boolean;
  onClose: () => void;
  authError?: string | null;
};

export function SignInModal({ open, onClose, authError }: Props) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      // Close when clicking the backdrop (the dialog element itself, not its children)
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  const handleCancel = useCallback(
    (e: React.SyntheticEvent<HTMLDialogElement>) => {
      e.preventDefault();
      onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="sign-in-modal m-auto w-full max-w-md rounded-xl border-2 border-ink bg-canvas p-0 shadow-[var(--shadow-modal)] backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      onClick={handleBackdropClick}
      onCancel={handleCancel}
    >
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark size="sm" />
            <Wordmark />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-panel hover:text-ink"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-2xl leading-tight text-ink sm:text-[28px]">
            Sign in to make the machine lie.
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Your prompt stays put. We just need somewhere to attach the evidence.
          </p>
        </div>

        {authError ? (
          <p className="text-sm font-medium text-barrier" role="alert">
            {authError}
          </p>
        ) : null}

        {/* Google button */}
        <GoogleSignInButton nextPath={pathname} />

        {/* Footer */}
        <p className="text-xs leading-relaxed text-muted">
          No password ceremony. By continuing, you agree not to blame us for the bit.
        </p>
      </div>
    </dialog>
  );
}
