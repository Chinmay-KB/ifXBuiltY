"use client";

import Image from "next/image";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";
import { buildSharePayload, type SharePlatform } from "@/lib/share/share-links";

type ShareSheetProps = {
  open: boolean;
  onClose: () => void;
  slug: string;
  builder: string;
  target: string;
  imageUrl: string | null;
};

type ToastState = { kind: "success" | "error"; message: string } | null;

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function CloseIcon() {
  return (
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
  );
}

function DragHandle() {
  return (
    <div className="flex w-full items-center justify-center py-2 sm:hidden" aria-hidden="true">
      <div className="h-1 w-10 rounded-full bg-line-strong/80" />
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function NativeShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

type ActionButtonProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
};

function ActionButton({ label, icon, onClick, disabled = false }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group inline-flex flex-col items-center gap-1.5",
        "transition-transform duration-200 ease-out motion-safe:hover:-translate-y-0.5",
        "disabled:cursor-not-allowed disabled:opacity-45",
      )}
    >
      <span
        className={cn(
          "inline-flex size-14 items-center justify-center rounded-full border border-line bg-canvas text-ink shadow-[0_1px_0_rgb(0_0_0/0.03)]",
          "transition-[transform,background-color,border-color] duration-200 ease-out group-hover:border-line-strong group-hover:bg-panel",
        )}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold text-ink">{label}</span>
    </button>
  );
}

export function ShareSheet({
  open,
  onClose,
  slug,
  builder,
  target,
  imageUrl,
}: ShareSheetProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const share = useMemo(() => {
    if (!open) return null;
    if (typeof window === "undefined") return null;
    return buildSharePayload({
      origin: window.location.origin,
      slug,
      builder,
      target,
    });
  }, [builder, open, slug, target]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ kind: "success", message: "Copied." });
    } catch {
      setToast({ kind: "error", message: "Couldn’t copy — blocked by browser." });
    }
  }, []);

  const handleSharePlatform = useCallback(
    (platform: SharePlatform) => {
      if (!share) return;
      openExternal(share.platform[platform]);
    },
    [share],
  );

  const handleNativeImageShare = useCallback(async () => {
    if (!share || !imageUrl || !navigator.share) {
      setToast({
        kind: "error",
        message: "Native image sharing is not supported on this browser.",
      });
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const file = new File([blob], `${slug}.${ext}`, { type: blob.type || "image/png" });
      const shareData: ShareData = { text: share.text, url: share.url };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        shareData.files = [file];
      }

      await navigator.share(shareData);
      setToast({ kind: "success", message: "Opened native share options." });
    } catch {
      setToast({
        kind: "error",
        message: "Couldn’t open native share right now.",
      });
    }
  }, [imageUrl, share, slug]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-1200 flex",
        "bg-black/55 backdrop-blur-md supports-backdrop-filter:bg-black/45",
        // Mobile: bottom sheet; Desktop: centered modal
        "items-end sm:items-center sm:justify-center",
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-sheet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "w-full bg-canvas/98 shadow-[0_30px_80px_rgb(0_0_0/0.38)]",
          "transition-[transform,opacity] duration-220 ease-out motion-reduce:transition-none",
          // Mobile sheet shape
          "rounded-t-3xl border-t border-line sm:rounded-3xl sm:border sm:border-line sm:max-w-[560px]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <DragHandle />

        <div
            className="flex items-start justify-between gap-3 px-5 pt-3 sm:px-6 sm:pt-5"
        >
          <div className="min-w-0">
            <h2 id="share-sheet-title" className="truncate font-display text-xl font-black text-ink">
              Share
            </h2>
            <p className="mt-1 truncate text-sm text-muted">
              What if “{builder}” built “{target}”
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-panel text-muted transition-colors hover:bg-line hover:text-ink"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 grid gap-4 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
          {/* Preview */}
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-canvas">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted">
                  —
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                What if “{builder}” built “{target}”?
              </p>
              {share ? (
                <p className="truncate text-xs text-muted">{share.url}</p>
              ) : (
                <p className="truncate text-xs text-muted">…</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-5 sm:gap-x-2 sm:gap-y-4">
            <ActionButton
              label="Copy link"
              icon={<CopyIcon />}
              onClick={() => {
                if (share) void copyText(share.url);
              }}
              disabled={!share}
            />
            <ActionButton
              label="Share image"
              icon={<NativeShareIcon />}
              onClick={() => {
                void handleNativeImageShare();
              }}
              disabled={!share || !imageUrl}
            />
            <ActionButton
              label="X"
              icon={
                <Image
                  src="/icons/share/x.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="opacity-95"
                />
              }
              onClick={() => handleSharePlatform("x")}
              disabled={!share}
            />
            <ActionButton
              label="LinkedIn"
              icon={
                <Image
                  src="/icons/share/linkedin.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="opacity-95"
                />
              }
              onClick={() => handleSharePlatform("linkedin")}
              disabled={!share}
            />
            <ActionButton
              label="Reddit"
              icon={
                <Image
                  src="/icons/share/reddit.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="opacity-95"
                />
              }
              onClick={() => handleSharePlatform("reddit")}
              disabled={!share}
            />
          </div>

          {/* Toast */}
          <div className="min-h-5" aria-live="polite">
            {toast ? (
              <p
                className={cn(
                  "text-xs font-semibold",
                  toast.kind === "success" ? "text-muted" : "text-barrier",
                )}
              >
                {toast.message}
              </p>
            ) : null}
          </div>

        </div>
      </div>
    </div>
    ,
    document.body,
  );
}

