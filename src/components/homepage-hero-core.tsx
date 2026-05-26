import Link from "next/link";

import { LogoMark, Wordmark } from "@/components/ui";

export function HomepageHeroCore() {
  return (
    <>
      <Link
        href="/"
        className="relative z-10 mb-7 flex items-center gap-2.5 md:hidden"
        aria-label="ifXBuiltY home"
      >
        <LogoMark size="sm" />
        <Wordmark className="text-[24px] leading-7" />
      </Link>

      <div className="relative z-10 flex max-w-[680px] flex-col items-center gap-5">
        <h1 className="text-center font-display text-[clamp(2.75rem,10vw,5rem)] font-black italic leading-[0.88] tracking-[-0.04em] text-ink">
          The world&apos;s worst product ideas.
        </h1>
        <p className="max-w-[480px] text-center text-[15px] leading-relaxed text-muted-foreground md:text-lg">
          Crossbreed any company with any product. Watch the UI write itself.
          One prompt, one cursed screenshot from a parallel universe.
        </p>
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-display text-base font-black italic text-chrome transition-all duration-200 hover:scale-[1.03] hover:opacity-90 active:scale-[0.97]"
          >
            Cook one up
            <span className="text-chrome">→</span>
          </Link>
          <a
            href="#feed"
            className="inline-flex items-center rounded-full border-[1.5px] border-line-strong px-5 py-[14px] text-sm font-medium text-muted transition-all duration-200 hover:border-ink hover:text-ink active:scale-[0.97]"
          >
            Browse the evidence
          </a>
        </div>
      </div>
    </>
  );
}

type HomepageHeroStatsProps = {
  ideasThisWeek: number;
  totalPublished: number;
};

export function HomepageHeroStats({
  ideasThisWeek,
  totalPublished,
}: HomepageHeroStatsProps) {
  return (
    <div className="flex w-full items-center justify-center gap-5 border-b border-line bg-panel/50 px-5 py-3 md:gap-8 md:py-3.5">
      {ideasThisWeek > 0 && (
        <>
          <StatItem value={String(ideasThisWeek)} label="ideas this week" />
          <div className="h-4 w-px bg-line" />
        </>
      )}
      {totalPublished >= 100 && (
        <>
          <StatItem
            value={formatCompact(totalPublished)}
            label="designers cooking"
          />
          <div className="h-4 w-px bg-line" />
        </>
      )}
      <StatItem value="∞" label="bad taste generated" />
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-sans text-lg font-extrabold text-ink md:text-xl">
        {value}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-muted md:text-[10px]">
        {label}
      </span>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
