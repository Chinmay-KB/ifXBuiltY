"use client";

import type { ReactNode } from "react";

type CardShareActionProps = {
  label: string;
  slug: string;
  icon: ReactNode;
};

export function CardShareAction({ label, slug, icon }: CardShareActionProps) {
  return (
    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-transform duration-150 hover:scale-110"
      aria-label="Share"
      onClick={(event) => {
        event.stopPropagation();
        const url = `${window.location.origin}/g/${slug}`;

        if (navigator.share) {
          void navigator.share({ title: label, url });
        } else {
          void navigator.clipboard.writeText(url);
        }
      }}
    >
      {icon}
    </button>
  );
}
