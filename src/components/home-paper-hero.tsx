import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";
import { formatCompactCount } from "@/lib/format-count";
import type { HomepageFeaturedGeneration } from "@/lib/homepage-featured-generations";

type FanCardPlacement = {
  restX: string;
  restY: string;
  restR: string;
  fanX: string;
  fanY: string;
  fanR: string;
  z: number;
  opacity?: number;
};

const DESKTOP_FAN_PLACEMENTS: FanCardPlacement[] = [
  {
    restX: "-82%",
    restY: "-63%",
    restR: "-4deg",
    fanX: "-92%",
    fanY: "-70%",
    fanR: "-7deg",
    z: 40,
  },
  {
    restX: "4%",
    restY: "-58%",
    restR: "3deg",
    fanX: "14%",
    fanY: "-66%",
    fanR: "6deg",
    z: 42,
  },
  {
    restX: "-69%",
    restY: "5%",
    restR: "3deg",
    fanX: "-86%",
    fanY: "13%",
    fanR: "5deg",
    z: 30,
  },
  {
    restX: "17%",
    restY: "9%",
    restR: "-4deg",
    fanX: "31%",
    fanY: "17%",
    fanR: "-6deg",
    z: 32,
  },
];

const MOBILE_STRIP_PLACEMENTS = [
  { x: "-4%", y: "2%", r: "-5deg", z: 30 },
  { x: "-20%", y: "13%", r: "4deg", z: 20 },
  { x: "-36%", y: "4%", r: "-9deg", z: 10 },
  { x: "-52%", y: "18%", r: "8deg", z: 0 },
] as const;

type HomePaperHeroProps = {
  featuredGenerations: HomepageFeaturedGeneration[];
};

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

function fanCardStyle(placement: FanCardPlacement): CSSProperties {
  return {
    "--rest-x": placement.restX,
    "--rest-y": placement.restY,
    "--rest-r": placement.restR,
    "--fan-x": placement.fanX,
    "--fan-y": placement.fanY,
    "--fan-r": placement.fanR,
    zIndex: placement.z,
    opacity: placement.opacity,
  } as CSSProperties;
}

function mobileCardStyle(
  placement: (typeof MOBILE_STRIP_PLACEMENTS)[number],
): CSSProperties {
  return {
    transform: `translate(${placement.x}, ${placement.y}) rotate(${placement.r})`,
    zIndex: placement.z,
  };
}

function HeroGenerationCard({
  item,
  index,
  className,
  style,
  priority = false,
}: {
  item: HomepageFeaturedGeneration;
  index?: number;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}) {
  const label = `${item.builder} built ${item.target}`;
  const score = formatCompactCount(item.netScore);
  const remixLabel =
    item.remixCount > 0
      ? `${formatCompactCount(item.remixCount)} remix${item.remixCount === 1 ? "" : "es"}`
      : "Fresh";

  return (
    <Link
      href={`/g/${item.slug}`}
      aria-label={`Open ${label}`}
      className={cn(
        "group/card block aspect-4/5 overflow-hidden rounded-[20px] border border-line bg-panel p-2 shadow-[0_18px_44px_rgba(0,0,0,0.14)] outline-none transition-shadow duration-200 ease-out hover:shadow-[0_30px_70px_rgba(0,0,0,0.24)] focus-visible:ring-4 focus-visible:ring-chrome/80",
        className,
      )}
      style={style}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[14px] bg-canvas">
        <div className="relative min-h-0 flex-1 bg-canvas">
          {typeof index === "number" ? (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-chrome px-2 py-1 font-mono text-[9px] font-bold leading-none text-ink shadow-sm">
              {String(index + 1).padStart(2, "0")}
            </span>
          ) : null}
          <Image
            src={item.imageUrl}
            alt={label}
            fill
            sizes="(max-width: 768px) 46vw, (max-width: 1280px) 23vw, 280px"
            className="object-contain p-2 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover/card:scale-[1.015]"
            priority={priority}
          />
        </div>
        <div className="pointer-events-none border-t border-line bg-canvas px-3 py-2.5">
          <p className="line-clamp-2 font-display text-[14px] font-black leading-[1.02] tracking-[-0.03em] text-ink">
            <span>{item.builder}</span>
            <span className="mx-1 font-sans text-[13px] font-semibold text-muted">
              ×
            </span>
            <span>{item.target}</span>
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-muted">
            <span>↑ {score}</span>
            <span>{remixLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function HeroFanFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-[24px] border border-line bg-panel p-4 text-center",
        compact ? "min-h-[150px]" : "h-full min-h-[320px]",
      )}
    >
      <div className="max-w-[220px]">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          Featured feed
        </p>
        <p className="mt-3 font-display text-3xl font-black italic leading-[0.9] tracking-[-0.04em] text-ink">
          Fresh generations brewing
        </p>
        <p className="mt-3 text-sm leading-snug text-subtle">
          Publish a few public generations and this stack turns into the real feed.
        </p>
      </div>
    </div>
  );
}

function DesktopGenerationFan({
  items,
}: {
  items: HomepageFeaturedGeneration[];
}) {
  const displayItems = items.slice(0, DESKTOP_FAN_PLACEMENTS.length);

  if (displayItems.length < 3) {
    return <HeroFanFallback />;
  }

  return (
    <div
      className="hero-generation-fan group relative h-[min(420px,40vw)] w-full min-w-0 max-w-[420px] flex-1 xl:max-w-[520px]"
      aria-label="Popular generations"
    >
      <div className="pointer-events-none absolute -inset-6 bg-[radial-gradient(circle_at_50%_50%,rgba(255,214,0,0.11),transparent_44%)]" />
      {displayItems.map((item, index) => (
        <HeroGenerationCard
          key={item.id}
          item={item}
          index={index}
          priority={index < 2}
          className="hero-fan-card absolute left-1/2 top-1/2 w-[168px] hover:z-80 focus-visible:z-80 lg:w-[184px] xl:w-[min(232px,19vw)]"
          style={fanCardStyle(DESKTOP_FAN_PLACEMENTS[index]!)}
        />
      ))}
    </div>
  );
}

function MobileGenerationStrip({
  items,
}: {
  items: HomepageFeaturedGeneration[];
}) {
  const displayItems = items.slice(0, MOBILE_STRIP_PLACEMENTS.length);

  if (displayItems.length < 3) {
    return <HeroFanFallback compact />;
  }

  return (
    <div
      className="relative mt-6 h-[210px] overflow-visible"
      aria-label="Popular generations"
    >
      {displayItems.map((item, index) => (
        <HeroGenerationCard
          key={item.id}
          item={item}
          priority={index === 0}
          className="absolute left-[42%] top-0 w-[43vw] max-w-[170px] rounded-[16px] p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.16)]"
          style={mobileCardStyle(MOBILE_STRIP_PLACEMENTS[index]!)}
        />
      ))}
    </div>
  );
}

/** Paper “Desktop — Home” + “Mobile — Home” (no status bar), signage palette. */
export function HomePaperHero({ featuredGenerations }: HomePaperHeroProps) {
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
        <h1 className="mt-5 font-display text-[clamp(2.75rem,17vw,4.25rem)] font-black leading-[0.86] tracking-tighter">
          What if X
          <br />
          built Y?
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-[145%] text-subtle">
          Crossbreed any company with any product. Watch the UI write itself. One prompt, one weird
          little world.
        </p>

        <MobileGenerationStrip items={featuredGenerations} />

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
        <div className="flex flex-1 items-center gap-12 px-8 pb-10 pt-6 lg:px-12 xl:gap-16 xl:px-20">
          <div className="flex w-full max-w-[470px] shrink-0 flex-col gap-7 xl:max-w-[640px]">
            <h1 className="font-display text-[clamp(3.25rem,7.2vw,7.75rem)] font-black leading-[0.84] tracking-tighter">
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

          <DesktopGenerationFan items={featuredGenerations} />
        </div>
      </div>
    </section>
  );
}
