"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import Zoom from "@/components/image-zoom";
import { ShareSheet } from "@/components/share-sheet";
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
  const [downloadState, setDownloadState] = useState<"idle" | "saved">("idle");
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const downloadResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = formatResultTitle(result.builder, result.target);
  const inputsChanged = hasInputsChanged(currentInputs, lastInputs);

  useEffect(() => {
    return () => {
      if (downloadResetRef.current) clearTimeout(downloadResetRef.current);
    };
  }, []);

  const flashDownloadState = useCallback(() => {
    setDownloadState("saved");
    if (downloadResetRef.current) clearTimeout(downloadResetRef.current);
    downloadResetRef.current = setTimeout(() => setDownloadState("idle"), 1800);
  }, []);

  const handleShare = useCallback(() => {
    setShareSheetOpen(true);
  }, []);

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
      flashDownloadState();
    } catch {
      // Silently fail on download error
    }
  }, [flashDownloadState, result.imageUrl, result.builder, result.target]);

  const handleRegenerate = useCallback(() => {
    onRegenerate(currentInputs);
  }, [onRegenerate, currentInputs]);

  if (variant === "paper") {
    const vc = viewportContained;
    const liveSlug = result.slug;
    const actionMotion =
      "transition-[transform,background-color,color,filter,border-color] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]";
    const quietActionClass = cn(
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-panel px-4 py-2.5 text-[13px] font-bold text-ink hover:bg-line",
      actionMotion,
    );
    return (
      <>
        <div
          className={cn(
            "flex flex-col",
            vc
              ? "min-h-0 gap-4 overflow-y-auto px-1 pb-4 lg:h-full lg:overflow-hidden lg:px-0 lg:pb-0 lg:flex-row lg:gap-5"
              : "gap-6 lg:flex-row lg:gap-12",
          )}
        >
          <figure
            className={cn(
              "relative isolate flex min-w-0 flex-col items-center justify-center overflow-hidden border border-line bg-linear-to-br from-panel to-canvas",
              vc
                ? "rounded-[22px] lg:min-h-0 lg:flex-1"
                : "min-h-[320px] rounded-3xl lg:min-h-[480px]",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-55"
              style={{
                backgroundImage:
                  "radial-gradient(circle farthest-corner at 20% 20% in oklab, oklab(88.5% -0.016 0.181 / 18%) 0%, oklab(0% 0 0 / 0%) 36%), linear-gradient(135deg, oklab(100% 0 0 / 0%) 0%, oklab(0% 0 0 / 4%) 100%)",
              }}
              aria-hidden
            />
            {result.imageUrl ? (
              <Zoom>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.imageUrl}
                  alt={title}
                  className={cn(
                    "relative z-10 object-contain",
                    vc
                      ? "max-h-[54vh] w-full lg:max-h-full lg:max-w-full"
                      : "h-full w-full",
                  )}
                  style={vc ? undefined : { maxHeight: "min(72vh, 640px)" }}
                />
              </Zoom>
            ) : (
              <div className={cn("flex items-center justify-center", vc ? "h-36" : "h-80")}>
                <span className="text-muted">Image unavailable</span>
              </div>
            )}
            <figcaption className="sr-only">{title}</figcaption>
          </figure>

          <aside
            className={cn(
              "flex w-full shrink-0 flex-col",
              vc
                ? "min-h-0 gap-4 lg:w-[320px] lg:overflow-y-auto lg:pr-1"
                : "gap-6 lg:w-[380px]",
            )}
            aria-label="Generated image actions"
          >
          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-panel py-1.5 pl-2.5 pr-3 lg:gap-2.5 lg:py-2 lg:pl-3 lg:pr-3.5">
              <span className="size-2 rounded-full bg-[#58CC02]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink lg:text-[11px]">
                Ready
              </span>
            </div>
            <h2
              className={cn(
                "font-display font-black leading-[0.92] tracking-[-0.04em] text-ink",
                vc
                  ? "text-[clamp(2rem,8vw,3rem)] lg:text-[clamp(1.9rem,2.9vw,2.6rem)]"
                  : "text-[clamp(2rem,4vw,3.25rem)]",
              )}
            >
              If {result.builder}
              <br />
              built {result.target}.
            </h2>
            <p className="max-w-136 text-sm leading-[1.45] text-muted">
              Save the artifact and share the public link while the joke is still warm.
            </p>
            {currentInputs.tone ? (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.04em] text-muted lg:mt-2 lg:text-[11px]">
                {currentInputs.tone} vibe
              </p>
            ) : null}
          </div>

          <div className={cn("flex flex-col", vc ? "gap-2.5" : "gap-3")}>
            <div>
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={!result.imageUrl}
                className={cn(
                  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-chrome px-5 py-3 font-sans text-base font-black text-ink disabled:opacity-40",
                  actionMotion,
                )}
              >
                {downloadState === "saved" ? <CheckIcon /> : <DownloadIcon />}
                {downloadState === "saved" ? "Saved" : "Save image"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link href={`/g/${liveSlug}`} className={quietActionClass}>
                <CheckIcon />
                View live
              </Link>
              <button
                type="button"
                onClick={() => void handleShare()}
                className={quietActionClass}
              >
                <ShareIcon />
                Share
              </button>
            </div>
          </div>

          <div className="min-h-5" aria-live="polite">
            {downloadState === "saved" ? (
              <p className="text-xs font-semibold text-muted">Image handed to your downloads folder.</p>
            ) : null}
          </div>

          <div className={cn("mt-auto border-t border-line pt-4", vc ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-2")}>
            <Button
              variant="chrome"
              size="lg"
              className={cn("font-black transition-transform duration-150 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]", vc && "h-11 px-5 text-sm")}
              onClick={onReset}
            >
              Generate another
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={cn("font-black transition-transform duration-150 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]", vc && "h-11 px-5 text-sm")}
              onClick={handleRegenerate}
            >
              Reroll same prompt
            </Button>
          </div>
          </aside>
        </div>

        <ShareSheet
          open={shareSheetOpen}
          onClose={() => setShareSheetOpen(false)}
          slug={result.slug}
          builder={result.builder}
          target={result.target}
          imageUrl={result.ogImageUrl ?? result.imageUrl}
        />
      </>
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
          <Link
            href={`/g/${result.slug}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-line-strong bg-canvas px-4 py-3 text-[14px] font-bold text-ink transition-colors hover:bg-panel"
          >
            <CheckIcon />
            View live
          </Link>

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

      <ShareSheet
        open={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
        slug={result.slug}
        builder={result.builder}
        target={result.target}
        imageUrl={result.ogImageUrl ?? result.imageUrl}
      />
    </div>
  );
}

/* ─── Inline SVG Icons ─── */

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
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

