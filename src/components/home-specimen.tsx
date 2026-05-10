"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { ShowcaseExample } from "@/data/showcase-examples";
import { showcaseImageUrl } from "@/data/showcase-examples";
import { cn } from "@/lib/cn";
import { HOME_SPECIMEN_HERO_SIZES } from "@/lib/generation-image-sizes";

function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildCookHref(example: ShowcaseExample) {
  const sp = new URLSearchParams();
  sp.set("b", example.builder);
  sp.set("t", example.target);
  return `/?${sp.toString()}#cook`;
}

function useDeterministicSpecimen(examples: ShowcaseExample[]) {
  return useMemo(() => {
    if (examples.length === 0) return null;
    // Keep it deterministic across SSR/CSR to avoid hydration mismatch.
    return examples[0]!;
  }, [examples]);
}

export function HomeSpecimen({
  examples,
  onShare,
}: {
  examples: ShowcaseExample[];
  onShare?: (href: string) => void;
}) {
  const specimen = useDeterministicSpecimen(examples);
  const related = useMemo(() => examples.slice(1, 5), [examples]);
  const [shareToast, setShareToast] = useState<string | null>(null);

  if (!specimen) return null;

  const { builder, target } = specimen;
  const headlineTarget = titleCase(target);
  const remixHref = buildCookHref(specimen);

  const relatedBg = ["bg-[#F6D93B]", "bg-[#2D6CF6]", "bg-[#2FA66C]", "bg-ink"];
  const relatedText = [
    "text-ink",
    "text-white",
    "text-white",
    "text-white",
  ];

  async function share() {
    const href = window.location.origin + remixHref;
    try {
      if (onShare) {
        onShare(href);
        return;
      }
      if (navigator.share) {
        await navigator.share({
          title: `if ${builder} built ${target}`,
          url: href,
        });
        return;
      }
      await navigator.clipboard.writeText(href);
      setShareToast("Link copied.");
      window.setTimeout(() => setShareToast(null), 2200);
    } catch {
      setShareToast("Couldn’t share. Copy from the address bar.");
      window.setTimeout(() => setShareToast(null), 2600);
    }
  }

  return (
    <section className="flex w-full flex-col gap-6 pt-2">
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
        <div className="w-full lg:max-w-[640px] xl:max-w-[720px]">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-4 sm:p-5 lg:h-[680px] xl:h-[740px]">
            <div className="flex h-full items-center justify-center rounded-xl bg-panel p-3 sm:p-4">
              <div className="relative h-full min-h-[240px] w-full">
                <Image
                  src={showcaseImageUrl(specimen)}
                  alt={`if ${builder} built ${target}`}
                  fill
                  sizes={HOME_SPECIMEN_HERO_SIZES}
                  priority
                  className="rounded-lg bg-white object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:h-[680px] xl:h-[740px]">
          <div className="flex h-full flex-col justify-center">
            <div className="max-w-[560px]">
              <p className="font-display tracking-[-0.015em] text-ink">
                <span className="block text-[42px] leading-[1.02] sm:text-[54px]">
                  If
                </span>
                <span className="relative mt-1 block w-fit text-[60px] font-black leading-[0.99] sm:text-[80px]">
                  {builder}
                  <span className="absolute -bottom-2 left-0 right-0 h-[6px] rounded-full bg-[#E8E306]" />
                </span>
                <span className="mt-2 block text-[42px] leading-[1.02] sm:text-[54px]">
                  built
                </span>
                <span className="relative mt-1 block w-fit text-[60px] font-black leading-[0.99] sm:text-[80px]">
                  {headlineTarget}
                  <span className="absolute -bottom-2 left-0 right-0 h-[6px] rounded-full bg-[#E8E306]" />
                </span>
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <Link
                  href={remixHref}
                  className="inline-flex h-14 items-center justify-center rounded-xl bg-[#E8E306] text-sm font-black text-ink hover:bg-[#E8E306]/90"
                >
                  Remix this
                </Link>
                <button
                  type="button"
                  onClick={() => void share()}
                  className="inline-flex h-14 items-center justify-center rounded-xl bg-ink text-sm font-black text-white hover:bg-ink/90"
                >
                  Share
                </button>
              </div>
              {shareToast ? (
                <p className="mt-3 text-sm font-semibold text-muted" role="status">
                  {shareToast}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <h2 className="text-[28px] font-black leading-tight text-ink">
          Related bad decisions
        </h2>
        <div className="grid gap-4 lg:grid-cols-4">
          {related.map((ex, idx) => {
            const bg = relatedBg[idx] ?? "bg-panel";
            const fg = relatedText[idx] ?? "text-ink";
            const n = 820 - idx * 113;
            return (
              <Link
                key={ex.id}
                href={buildCookHref(ex)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl p-5 transition-transform hover:-translate-y-0.5",
                  bg,
                  fg,
                )}
              >
                <p className="text-xl font-black leading-snug">
                  {ex.builder} built {titleCase(ex.target)}
                </p>
                <p className={cn("mt-10 text-sm font-semibold opacity-80")}>
                  ↑ {n} · Fork
                </p>
                <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 group-hover:ring-black/15" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

