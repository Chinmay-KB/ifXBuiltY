import Link from "next/link";

import { cn } from "@/lib/cn";

const redCardBg =
  "linear-gradient(160deg, oklab(65.4% 0.204 0.111) 0%, oklab(53.4% 0.169 0.092) 100%)";
const darkCardBg =
  "linear-gradient(165deg, oklab(24.1% -0.017 0.014) 0%, oklab(16.1% -0.011 0.008) 100%)";

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path
        d="M5 12h14M12 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MascotIllustration({ size = 70 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
    >
      <ellipse cx="40" cy="42" rx="26" ry="30" fill="#58CC02" />
      <ellipse cx="40" cy="38" rx="20" ry="22" fill="#89E219" />
      <circle cx="32" cy="34" r="6" fill="#FFFFFF" />
      <circle cx="48" cy="34" r="6" fill="#FFFFFF" />
      <circle cx="32" cy="34" r="3" fill="#0A0A0A" />
      <circle cx="48" cy="34" r="3" fill="#0A0A0A" />
      <path d="M34 46 L40 52 L46 46 Z" fill="#FF9600" />
    </svg>
  );
}

function SocialAvatarStack({ className }: { className?: string }) {
  const rings = [
    { bg: "bg-chrome", text: "text-ink", label: "R" },
    { bg: "bg-barrier", text: "text-white", label: "S" },
    { bg: "bg-ink", text: "text-chrome", label: "M" },
    { bg: "bg-[#2A4A2A]", text: "text-[#89E219]", label: "A" },
  ];
  return (
    <div className={cn("flex items-center", className)}>
      {rings.map((ring, i) => (
        <div
          key={ring.label}
          className={cn(
            "flex size-[26px] shrink-0 items-center justify-center rounded-full border-2 border-canvas font-display text-[11px] font-black italic",
            ring.bg,
            ring.text,
            i > 0 && "-ml-2",
          )}
        >
          {ring.label}
        </div>
      ))}
    </div>
  );
}

/** Paper “Desktop — Home” + “Mobile — Home” (no status bar), signage palette. */
export function HomePaperHero() {
  return (
    <section className="bg-canvas text-ink antialiased">
      {/* ─── Mobile (Paper Mobile — Home, simplified top: no duplicate nav) ─── */}
      <div className="mx-auto flex max-w-[1440px] flex-col px-6 pb-10 pt-6 md:hidden">
        <div className="flex items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-chrome" aria-hidden />
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink">
            Product design · parallel universes
          </p>
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.75rem,17vw,4.25rem)] font-black leading-[0.86] tracking-[-0.05em]">
          What if X
          <br />
          built Y?
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-[145%] text-subtle">
          Crossbreed any company with any product. Watch the UI write itself. One prompt, one weird
          little world.
        </p>

        <div className="mt-6 flex gap-2.5">
          <div
            className="flex aspect-[0.7/1] flex-1 flex-col items-center justify-center rounded-[14px] p-3 motion-safe:-rotate-3"
            style={{ backgroundImage: redCardBg }}
          >
            <p className="text-center font-display text-[28px] font-black italic leading-[85%] tracking-[-0.04em] text-white">
              ITR-
              <br />
              FÄRM
            </p>
          </div>
          <div
            className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-[14px] p-3"
            style={{ backgroundImage: darkCardBg }}
          >
            <MascotIllustration size={46} />
            <p className="text-center font-mono text-[7px] uppercase tracking-[0.15em] text-chrome">
              Gate B-14
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[14px] bg-chrome p-3 motion-safe:rotate-3">
            <p className="font-mono text-[7px] uppercase tracking-[0.15em] text-muted">Now Serving</p>
            <p className="font-display text-2xl font-black italic text-ink">A-0042</p>
            <div className="flex gap-0.5">
              <span className="bg-ink px-1 py-px font-mono text-[6px] text-chrome">/page</span>
              <span className="bg-ink px-1 py-px font-mono text-[6px] text-chrome">/tbl</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2.5">
          <Link
            href="/generate"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink py-[18px] pl-5 pr-[18px] font-display text-lg font-black italic tracking-tight text-chrome transition-opacity hover:opacity-90"
          >
            Start generating
            <ArrowRightIcon className="text-chrome" />
          </Link>
          <Link
            href="/feed"
            className="inline-flex items-center justify-center rounded-full border-[1.5px] border-ink py-4 font-sans text-sm font-semibold text-ink transition-colors hover:bg-panel"
          >
            Browse the feed
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <SocialAvatarStack />
          <p className="font-mono text-[10px] tracking-[0.04em] text-muted">
            12,840 designers this month
          </p>
        </div>
      </div>

      {/* ─── Desktop (Paper Desktop — Home) ─── */}
      <div className="mx-auto hidden min-h-[calc(100dvh-5rem)] max-w-[1440px] flex-col justify-center md:flex">
        <div className="flex flex-1 items-center gap-12 px-8 pb-10 pt-6 lg:gap-16 lg:px-12 xl:px-20">
          <div className="flex w-full max-w-[640px] shrink-0 flex-col gap-7">
            <h1 className="font-display text-[clamp(3.25rem,7.2vw,7.75rem)] font-black leading-[0.84] tracking-[-0.05em]">
              What if X built Y?
            </h1>
            <p className="max-w-[520px] text-[19px] leading-[145%] text-subtle">
              Crossbreed any company with any product. Watch the UI write itself. One prompt, one
              weird little world.
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-4">
              <Link
                href="/generate"
                className="inline-flex items-center gap-2.5 rounded-full bg-ink py-5 pl-7 pr-6 font-display text-xl font-black italic tracking-tight text-chrome transition-opacity hover:opacity-90"
              >
                Start generating
                <ArrowRightIcon className="text-chrome" />
              </Link>
              <Link
                href="/feed"
                className="inline-flex items-center rounded-full border-[1.5px] border-ink py-5 px-6 font-sans text-[15px] font-semibold text-ink transition-colors hover:bg-panel"
              >
                Browse the feed
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <SocialAvatarStack />
              <p className="max-w-sm font-mono text-[11px] tracking-[0.04em] text-muted">
                12,840 designers brewing alternate timelines this month
              </p>
            </div>
          </div>

          <div className="relative mx-auto h-[min(388px,42vw)] w-full min-w-0 max-w-[520px] flex-1">
            <div
              className="absolute right-[12%] top-8 w-[260px] overflow-hidden rounded-[20px] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] motion-safe:-rotate-6 max-lg:right-[4%] max-lg:w-[220px]"
              style={{ backgroundImage: darkCardBg }}
            >
              <span className="inline-block rounded-full bg-chrome px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-ink">
                Chaotic
              </span>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <MascotIllustration />
                <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-chrome">
                  Gate B-14
                  <br />→ 5 day streak
                </p>
              </div>
            </div>
            <div
              className="absolute bottom-6 left-[6%] w-[300px] overflow-hidden rounded-[20px] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] motion-safe:rotate-[4deg] max-lg:left-0 max-lg:w-[240px]"
              style={{ backgroundImage: redCardBg }}
            >
              <span className="inline-block rounded-full bg-white px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-barrier">
                Scammy
              </span>
              <div className="flex flex-col items-center justify-center gap-4 px-5 py-10">
                <p className="text-center font-display text-[60px] font-black italic leading-[85%] tracking-[-0.05em] text-white max-lg:text-5xl">
                  ITR-
                  <br />
                  FÄRM
                </p>
                <div className="flex w-full flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-sm bg-white font-mono text-[10px] font-bold text-barrier">
                      1
                    </span>
                    <span className="font-sans text-[11px] font-medium text-white">
                      Ikke assemble · 47 parts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-sm bg-white font-mono text-[10px] font-bold text-barrier">
                      2
                    </span>
                    <span className="font-sans text-[11px] font-medium text-white">
                      Ingen refund · 2 hex key
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
