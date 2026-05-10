"use client";

import Link from "next/link";
import { useState } from "react";

type ImageOverlayActionsProps = {
  generationId: number;
  slug: string;
  title: string;
  imageDownloadUrl: string | null;
};

/**
 * Overlay action buttons on the hero image.
 * Always visible as circular icon buttons; when the mouse enters the button region,
 * all buttons expand to show their labels.
 */
export function ImageOverlayActions({
  generationId,
  slug,
  title,
  imageDownloadUrl,
}: ImageOverlayActionsProps) {
  const [expanded, setExpanded] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/g/${slug}`;
    if (navigator.share) {
      navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div
      className="pointer-events-auto absolute bottom-3 right-3 z-20 flex flex-col gap-2"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <OverlayPill as="link" href={`/remix/${generationId}`} label="Remix" expanded={expanded}>
        <RemixIcon />
      </OverlayPill>

      {imageDownloadUrl && (
        <OverlayPill as="download" href={imageDownloadUrl} label="Download" expanded={expanded}>
          <DownloadIcon />
        </OverlayPill>
      )}

      <OverlayPill as="button" onClick={handleShare} label="Share" expanded={expanded}>
        <ShareIcon />
      </OverlayPill>
    </div>
  );
}

/* ─── Overlay pill: icon circle that expands to show label when region is hovered ─── */

type OverlayPillProps = {
  label: string;
  expanded: boolean;
  children: React.ReactNode;
} & (
  | { as: "link"; href: string }
  | { as: "download"; href: string }
  | { as: "button"; onClick: () => void }
);

function OverlayPill(props: OverlayPillProps) {
  const { expanded } = props;

  const inner = (
    <>
      <span className="flex h-5 w-5 items-center justify-center shrink-0">
        {props.children}
      </span>
      <span
        className="overflow-hidden whitespace-nowrap text-xs font-semibold transition-all duration-200"
        style={{
          maxWidth: expanded ? "80px" : "0px",
          opacity: expanded ? 1 : 0,
        }}
      >
        {props.label}
      </span>
    </>
  );

  const className = [
    "inline-flex items-center justify-center rounded-full text-white backdrop-blur-sm transition-all duration-200",
    expanded ? "gap-1.5 bg-black/85 px-3 py-2" : "gap-0 bg-black/60 p-2",
  ].join(" ");

  if (props.as === "link") {
    return (
      <Link href={props.href} className={className}>
        {inner}
      </Link>
    );
  }
  if (props.as === "download") {
    return (
      <a href={props.href} download className={className}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={className}>
      {inner}
    </button>
  );
}

/* ─── Icons ─── */

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
        d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
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
      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
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
      <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .799l6.733 3.366a2.5 2.5 0 11-.671 1.341l-6.733-3.366a2.5 2.5 0 110-3.482l6.733-3.366A2.52 2.52 0 0113 4.5z" />
    </svg>
  );
}
