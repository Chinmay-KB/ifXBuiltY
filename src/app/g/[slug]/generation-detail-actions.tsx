"use client";

import Link from "next/link";
import { useState } from "react";

type GenerationDetailActionsProps = {
  generationId: number;
  slug: string;
  title: string;
  imageDownloadUrl: string | null;
};

export function GenerationDetailActions({
  generationId,
  slug,
  title,
  imageDownloadUrl,
}: GenerationDetailActionsProps) {
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  async function handleShare() {
    const url = `${window.location.origin}/g/${slug}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        setShareMessage("Shared from the lab.");
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied. Go cause a timeline problem.");
      }
    } catch {
      setShareMessage("Share cancelled.");
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Link
        href={`/remix/${generationId}`}
        className="group inline-flex min-h-14 items-center justify-between rounded-full bg-chrome py-3 pl-5 pr-3 font-display text-[21px] font-black italic tracking-[-0.02em] text-ink transition-[filter,transform] hover:brightness-[0.98] active:translate-y-px"
      >
        <span>Remix this</span>
        <span className="flex size-9 items-center justify-center rounded-full bg-ink text-chrome transition-transform duration-200 group-hover:rotate-6 group-hover:scale-105">
          <RemixIcon />
        </span>
      </Link>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => void handleShare()}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-chrome transition-[filter,transform] hover:brightness-110 active:translate-y-px"
        >
          <ShareIcon />
          Share
        </button>

        {imageDownloadUrl ? (
          <a
            href={imageDownloadUrl}
            download
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-panel px-4 text-sm font-bold text-ink transition-colors hover:bg-line"
          >
            <DownloadIcon />
            Download
          </a>
        ) : (
          <span className="inline-flex min-h-12 items-center justify-center rounded-full bg-panel px-4 text-sm font-bold text-muted">
            No file
          </span>
        )}
      </div>

      <p
        className="min-h-5 px-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted"
        role="status"
        aria-live="polite"
      >
        {shareMessage ?? "Share-ready in one tap."}
      </p>
    </div>
  );
}

function RemixIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 1 0 1.5H3.989a.75.75 0 0 1-.75-.75v-4.242a.75.75 0 0 1 1.5 0v2.43l.31-.31a7 7 0 0 0 11.712-3.138.75.75 0 0 1-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0v2.43l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .799l6.733 3.366a2.5 2.5 0 1 1-.671 1.341l-6.733-3.366a2.5 2.5 0 1 1 0-3.482l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z" />
    </svg>
  );
}
