"use client";

import { useEffect, useRef, useState } from "react";

import { WallCard, type WallItem } from "@/components/wall-card";

type ConveyorRowProps = {
  items: WallItem[];
  direction: "left" | "right";
  /** Pixels per second */
  speed: number;
  /** Row height in px */
  height: number;
  /** Whether cards in this row should load eagerly */
  eager?: boolean;
  /** Seed for deterministic tilt values */
  rowIndex?: number;
};

/** Generate a deterministic pseudo-random tilt for a card */
function getTilt(rowIndex: number, cardIndex: number): number {
  const seed = (rowIndex * 17 + cardIndex * 31) % 100;
  return (seed / 100) * 4 - 2;
}

/**
 * Single horizontal conveyor strip that loops infinitely via CSS animation.
 * Renders items twice for seamless wrapping. Pauses on hover.
 * Uses inline animation styles to avoid CSS specificity issues with Tailwind v4.
 */
export function ConveyorRow({
  items,
  direction,
  speed,
  height,
  eager = false,
  rowIndex = 0,
}: ConveyorRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [animDuration, setAnimDuration] = useState<number>(0);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    // Wait for layout to compute
    const raf = requestAnimationFrame(() => {
      const halfWidth = el.scrollWidth / 2;
      if (halfWidth > 0) {
        setAnimDuration(halfWidth / speed);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [items.length, speed, height]);

  if (items.length === 0) return null;

  // Fallback duration estimate: each card ~= height * 1.5 + 12px gap
  const fallback = (items.length * (height * 1.5 + 12)) / speed;
  const dur = animDuration > 0 ? animDuration : fallback;

  const animationName = direction === "left" ? "conveyor-left" : "conveyor-right";

  return (
    <div className="w-full overflow-hidden" style={{ height: height + 16, padding: "8px 0" }}>
      <div
        ref={rowRef}
        style={{
          display: "flex",
          flexWrap: "nowrap",
          width: "max-content",
          gap: "12px",
          willChange: "transform",
          animation: `${animationName} ${dur.toFixed(1)}s linear infinite`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget.style.animationPlayState = "paused");
        }}
        onMouseLeave={(e) => {
          (e.currentTarget.style.animationPlayState = "running");
        }}
      >
        {/* Original set */}
        {items.map((item, i) => (
          <WallCard
            key={`a-${item.id}-${i}`}
            item={item}
            height={height}
            eager={eager && i < 6}
            tilt={getTilt(rowIndex, i)}
          />
        ))}
        {/* Duplicate set for seamless loop */}
        {items.map((item, i) => (
          <WallCard
            key={`b-${item.id}-${i}`}
            item={item}
            height={height}
            eager={false}
            tilt={getTilt(rowIndex, i + items.length)}
          />
        ))}
      </div>
    </div>
  );
}
