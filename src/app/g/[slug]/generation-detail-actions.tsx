"use client";

import { useState } from "react";

import { ShareSheet } from "@/components/share-sheet";

type GenerationDetailActionsProps = {
  slug: string;
  builder: string;
  target: string;
  imageUrl: string | null;
  imageDownloadUrl: string | null;
};

export function GenerationDetailActions({
  slug,
  builder,
  target,
  imageUrl,
  imageDownloadUrl,
}: GenerationDetailActionsProps) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setShareOpen(true)}
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

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        slug={slug}
        builder={builder}
        target={target}
        imageUrl={imageUrl}
      />
    </div>
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
