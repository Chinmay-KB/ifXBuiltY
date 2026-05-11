"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import Zoom from "@/components/image-zoom";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatResultTitle, hasInputsChanged } from "@/lib/ui/format";
import type { GenerationInputs, GenerationResult } from "@/lib/ui/types";

type GenerationResultViewProps = {
  result: GenerationResult;
  currentInputs: GenerationInputs;
  lastInputs: GenerationInputs;
  onReset: () => void;
  onRegenerate: (inputs: GenerationInputs) => void;
  variant?: "default" | "paper";
  /** Fit image + actions inside a fixed viewport (Generate page layout) */
  viewportContained?: boolean;
};

/**
 * GenerationResultView — displayed after a successful generation.
 *
 * Layout: Image on the left, action buttons stacked vertically on the right.
 * On mobile, stacks vertically (image top, actions below).
 */
export function GenerationResultView({
  result,
  currentInputs,
  lastInputs,
  onReset,
  onRegenerate,
  variant = "default",
  viewportContained = false,
}: GenerationResultViewProps) {
  const [publishState, setPublishState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const title = formatResultTitle(result.builder, result.target);
  const inputsChanged = hasInputsChanged(currentInputs, lastInputs);

  const handlePublish = useCallback(async () => {
    setPublishState("loading");
    setPublishError(null);

    try {
      const res = await fetch(`/api/generations/${result.id}/publish`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not publish");
      }

      const data = await res.json();
      setPublishedSlug(data.slug ?? result.slug);
      setPublishState("success");
    } catch (err) {
      setPublishError(
        err instanceof Error ? err.message : "Could not publish",
      );
      setPublishState("error");
    }
  }, [result.id, result.slug]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/g/${result.slug}`;
    const shareData = {
      title,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  }, [result.slug, title]);

  const handleDownload = useCallback(async () => {
    if (!result.imageUrl) return;

    try {
      const res = await fetch(result.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.builder}-built-${result.target}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail on download error
    }
  }, [result.imageUrl, result.builder, result.target]);

  const handleRegenerate = useCallback(() => {
    onRegenerate(currentInputs);
  }, [onRegenerate, currentInputs]);

  if (variant === "paper") {
    const vc = viewportContained;
    return (
      <div
        className={cn(
          "flex flex-col",
          vc
            ? "h-full min-h-0 gap-3 overflow-hidden lg:flex-row lg:gap-5"
            : "gap-6 lg:flex-row lg:gap-12",
        )}
      >
        <div
          className={cn(
            "min-w-0 flex-1 overflow-hidden bg-gradient-to-br from-panel to-canvas",
            vc
              ? "flex min-h-0 items-center justify-center rounded-2xl"
              : "min-h-[320px] rounded-3xl lg:min-h-[480px]",
          )}
        >
          {result.imageUrl ? (
            <Zoom>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.imageUrl}
                alt={title}
                className={cn("object-contain", vc ? "max-h-full max-w-full" : "h-full w-full")}
                style={vc ? undefined : { maxHeight: "min(72vh, 640px)" }}
              />
            </Zoom>
          ) : (
            <div className={cn("flex items-center justify-center", vc ? "h-36" : "h-80")}>
              <span className="text-muted">Image unavailable</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex w-full shrink-0 flex-col",
            vc ? "min-h-0 gap-3 lg:w-[260px]" : "gap-6 lg:w-[380px]",
          )}
        >
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-panel py-1.5 pl-2.5 pr-3 lg:gap-2.5 lg:py-2 lg:pl-3 lg:pr-3.5">
            <span className="size-2 rounded-full bg-[#58CC02]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink lg:text-[11px]">
              Generated
            </span>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted lg:text-[10px]">
              Fresh from the multiverse
            </p>
            <h2
              className={cn(
                "mt-1 font-display font-black leading-[0.94] tracking-[-0.04em] text-ink lg:mt-2",
                vc
                  ? "text-[clamp(1.15rem,2.4vw,1.65rem)]"
                  : "text-[clamp(2rem,4vw,3.25rem)]",
              )}
            >
              If {result.builder}
              <br />
              built {result.target}.
            </h2>
            {currentInputs.tone ? (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.04em] text-muted lg:mt-2 lg:text-[11px]">
                {currentInputs.tone} vibe
              </p>
            ) : null}
          </div>

          <div className={cn("flex flex-col", vc ? "gap-2" : "gap-2.5")}>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={!result.imageUrl}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-chrome font-sans font-bold text-ink transition-opacity disabled:opacity-40",
                  vc ? "px-3 py-2.5 text-sm" : "py-4 px-4 text-base",
                )}
              >
                <DownloadIcon />
                Save image
              </button>
              <button
                type="button"
                onClick={() => void handleShare()}
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full bg-ink text-white",
                  vc ? "size-11" : "size-14",
                )}
                aria-label="Share"
              >
                <ShareIcon />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
              {publishState === "success" ? (
                <Link
                  href={`/g/${publishedSlug}`}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-full bg-panel font-sans font-semibold text-ink transition-colors hover:bg-line",
                    vc ? "py-2 text-[11px]" : "py-3 text-[13px]",
                  )}
                >
                  View live
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void handlePublish()}
                  disabled={publishState === "loading"}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-full bg-panel font-sans font-semibold text-ink transition-colors hover:bg-line disabled:opacity-50",
                    vc ? "py-2 text-[11px]" : "py-3 text-[13px]",
                  )}
                >
                  {publishState === "loading" ? "Publishing…" : "Publish"}
                </button>
              )}
              <Link
                href={`/remix/${result.id}`}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-full bg-panel font-sans font-semibold text-ink transition-colors hover:bg-line",
                  vc ? "py-2 text-[11px]" : "py-3 text-[13px]",
                )}
              >
                Remix
              </Link>
              <button
                type="button"
                onClick={() => void handleShare()}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-full bg-panel font-sans font-semibold text-ink transition-colors hover:bg-line",
                  vc ? "py-2 text-[11px]" : "py-3 text-[13px]",
                )}
              >
                Link
              </button>
            </div>
          </div>

          {publishState === "error" && publishError && (
            <p className="text-sm font-medium text-barrier" role="alert">
              {publishError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="chrome"
              size="lg"
              className={cn("font-black", vc && "h-10 px-4 text-sm")}
              onClick={onReset}
            >
              Generate another
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={cn("font-black", !inputsChanged && "opacity-50", vc && "h-10 px-4 text-sm")}
              disabled={!inputsChanged}
              onClick={handleRegenerate}
            >
              Regenerate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <h2 className="font-display text-xl font-black text-ink md:text-2xl">
        {title}
      </h2>

      {/* Two-column: image left, actions right */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Left — Image */}
        <div className="w-full overflow-hidden rounded-xl border border-line bg-panel lg:max-w-[520px]">
          {result.imageUrl ? (
            <Zoom>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.imageUrl}
                alt={title}
                className="w-full object-contain"
                style={{ maxHeight: "600px" }}
              />
            </Zoom>
          ) : (
            <div className="flex h-[300px] items-center justify-center bg-ink/5">
              <span className="text-sm text-muted">Image unavailable</span>
            </div>
          )}
        </div>

        {/* Right — Actions */}
        <div className="flex flex-col gap-3 lg:w-[200px] lg:shrink-0">
          {/* Publish */}
          {publishState === "success" ? (
            <Link
              href={`/g/${publishedSlug}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-line-strong bg-canvas px-4 py-3 text-[14px] font-bold text-ink transition-colors hover:bg-panel"
            >
              <PublishIcon />
              Published — View
            </Link>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-center font-bold"
              onClick={() => void handlePublish()}
              disabled={publishState === "loading"}
            >
              <span className="flex items-center gap-2">
                <PublishIcon />
                {publishState === "loading" ? "Publishing…" : "Publish"}
              </span>
            </Button>
          )}

          {/* Share */}
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-center font-bold"
            onClick={() => void handleShare()}
          >
            <span className="flex items-center gap-2">
              <ShareIcon />
              Share
            </span>
          </Button>

          {/* Download */}
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-center font-bold"
            onClick={() => void handleDownload()}
            disabled={!result.imageUrl}
          >
            <span className="flex items-center gap-2">
              <DownloadIcon />
              Download
            </span>
          </Button>

          {/* Remix */}
          <Link
            href={`/remix/${result.id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-line-strong bg-canvas px-4 py-3 text-[14px] font-bold text-ink transition-colors hover:bg-panel"
          >
            <RemixIcon />
            Remix
          </Link>

          {/* Publish error */}
          {publishState === "error" && publishError && (
            <p className="text-sm font-medium text-barrier" role="alert">
              {publishError}
            </p>
          )}

          {/* Spacer to push generate buttons to bottom on desktop */}
          <div className="hidden lg:flex lg:flex-1" />

          {/* Generate another / Regenerate */}
          <div className="flex flex-col gap-2 pt-4 lg:pt-0">
            <Button
              variant="chrome"
              size="lg"
              className="w-full font-black"
              onClick={onReset}
            >
              Generate another
            </Button>

            <Button
              variant="outline"
              size="lg"
              className={cn("w-full font-black", !inputsChanged && "opacity-50")}
              disabled={!inputsChanged}
              onClick={handleRegenerate}
            >
              Regenerate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Inline SVG Icons ─── */

function PublishIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2L12 16" />
      <path d="M17 7L12 2L7 7" />
      <path d="M20 21H4" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
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

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function RemixIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
