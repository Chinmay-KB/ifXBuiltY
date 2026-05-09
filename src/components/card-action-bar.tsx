"use client";

import Link from "next/link";

import { cn } from "@/lib/cn";

type CardActionBarProps = {
  generationId: number;
  slug: string;
  imageUrl: string | null;
};

/* ─── Icons (inline SVG, no emoji) ─── */

function RemixIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5", className)}
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

/* ─── Action Handlers ─── */

async function handleDownload(imageUrl: string | null) {
  if (!imageUrl) return;

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generation.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // Fallback: open image in new tab
    window.open(imageUrl, "_blank");
  }
}

async function handleShare(slug: string) {
  const url = `${window.location.origin}/g/${slug}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: "Check this out!", url });
      return;
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }

  // Fallback: copy link to clipboard
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Silent fail — no toast system wired yet
  }
}

/* ─── Main Component ─── */

export function CardActionBar({
  generationId,
  slug,
  imageUrl,
}: CardActionBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        // Mobile: always visible, 44×44 touch targets, 8px spacing
        "md:gap-1 max-md:gap-[8px]",
      )}
      role="toolbar"
      aria-label="Card actions"
    >
      {/* Remix */}
      <Link
        href={`/remix/${generationId}`}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-tile)]",
          "text-remix transition-colors",
          "duration-[var(--transition-duration-default)]",
          "hover:bg-remix/10",
          // 44×44 touch targets on mobile
          "max-md:size-[44px] md:size-8",
        )}
        aria-label="Remix this generation"
      >
        <RemixIcon />
      </Link>

      {/* Download */}
      <button
        type="button"
        onClick={() => handleDownload(imageUrl)}
        disabled={!imageUrl}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-tile)]",
          "text-ink transition-colors",
          "duration-[var(--transition-duration-default)]",
          "hover:bg-ink/10",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          // 44×44 touch targets on mobile
          "max-md:size-[44px] md:size-8",
        )}
        aria-label="Download image"
      >
        <DownloadIcon />
      </button>

      {/* Share */}
      <button
        type="button"
        onClick={() => handleShare(slug)}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-tile)]",
          "text-ink transition-colors",
          "duration-[var(--transition-duration-default)]",
          "hover:bg-ink/10",
          // 44×44 touch targets on mobile
          "max-md:size-[44px] md:size-8",
        )}
        aria-label="Share this generation"
      >
        <ShareIcon />
      </button>
    </div>
  );
}
