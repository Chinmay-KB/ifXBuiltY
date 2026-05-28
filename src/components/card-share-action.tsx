"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { ShareSheet } from "@/components/share-sheet";

type CardShareActionProps = {
  label: string;
  slug: string;
  builder: string;
  target: string;
  icon: ReactNode;
  imageUrl: string | null;
};

export function CardShareAction({
  label,
  slug,
  builder,
  target,
  icon,
  imageUrl,
}: CardShareActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-transform duration-150 hover:scale-110"
        aria-label={label || "Share"}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {icon}
      </button>

      <ShareSheet
        open={open}
        onClose={() => setOpen(false)}
        slug={slug}
        builder={builder}
        target={target}
        imageUrl={imageUrl}
      />
    </>
  );
}
