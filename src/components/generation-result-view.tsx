"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

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
};

/**
 * GenerationResultView — displayed after a successful generation.
 *
 * Features:
 * - Hero image at full width, max 600px height, object-fit contain
 * - Title: "if [Builder] built [Target]"
 * - Action pills: publish, share, download, remix
 * - "Generate another" resets to input phase
 * - "Regenerate" enabled when inputs differ from last generation
 * - Publish flow with success link to public page
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 */
export function GenerationResultView({
  result,
  currentInputs,
  lastInputs,
  onReset,
  onRegenerate,
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

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <h2 className="font-display text-xl font-black text-ink md:text-2xl">
        {title}
      </h2>

      {/* Hero image */}
      <div className="w-full overflow-hidden rounded-xl border border-line bg-panel">
        {result.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.imageUrl}
            alt={title}
            className="w-full object-contain"
            style={{ maxHeight: "600px" }}
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center bg-ink/5">
            <span className="text-sm text-muted">Image unavailable</span>
          </div>
        )}
      </div>

      {/* Action pills */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Publish */}
        {publishState === "success" ? (
          <Link
            href={`/g/${publishedSlug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-canvas px-3.5 py-2 text-[13px] font-extrabold leading-[18px] text-ink transition-colors hover:bg-panel"
          >
            <PublishIcon />
            Published — View
          </Link>
        ) : (
          <Button
            variant="pillOutline"
            onClick={() => void handlePublish()}
            disabled={publishState === "loading"}
          >
            <span className="flex items-center gap-1.5">
              <PublishIcon />
              {publishState === "loading" ? "Publishing…" : "Publish"}
            </span>
          </Button>
        )}

        {/* Share */}
        <Button variant="pillOutline" onClick={() => void handleShare()}>
          <span className="flex items-center gap-1.5">
            <ShareIcon />
            Share
          </span>
        </Button>

        {/* Download */}
        <Button
          variant="pillOutline"
          onClick={() => void handleDownload()}
          disabled={!result.imageUrl}
        >
          <span className="flex items-center gap-1.5">
            <DownloadIcon />
            Download
          </span>
        </Button>

        {/* Remix */}
        <Link
          href={`/remix/${result.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-canvas px-3.5 py-2 text-[13px] font-extrabold leading-[18px] text-ink transition-colors hover:bg-panel"
        >
          <RemixIcon />
          Remix
        </Link>
      </div>

      {/* Publish error */}
      {publishState === "error" && publishError && (
        <p className="text-sm font-medium text-barrier" role="alert">
          {publishError}
        </p>
      )}

      {/* Generate another / Regenerate actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
        <Button
          variant="chrome"
          size="lg"
          className="flex-1 font-black"
          onClick={onReset}
        >
          Generate another
        </Button>

        <Button
          variant="outline"
          size="lg"
          className={cn("flex-1 font-black", !inputsChanged && "opacity-50")}
          disabled={!inputsChanged}
          onClick={handleRegenerate}
        >
          Regenerate
        </Button>
      </div>
    </div>
  );
}

/* ─── Inline SVG Icons ─── */

function PublishIcon() {
  return (
    <svg
      width="14"
      height="14"
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
      width="14"
      height="14"
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
      width="14"
      height="14"
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
      width="14"
      height="14"
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
