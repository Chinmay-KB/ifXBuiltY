"use client";

import { ConveyorRow } from "@/components/conveyor-row";
import { FloatingOverlay } from "@/components/floating-overlay";
import type { WallItem } from "@/components/wall-card";

type RowConfig = {
  direction: "left" | "right";
  speed: number;
  height: number;
};

// Varied heights and speeds for visual chaos
const ROW_CONFIGS: RowConfig[] = [
  { direction: "left", speed: 22, height: 160 },
  { direction: "right", speed: 32, height: 200 },
  { direction: "left", speed: 28, height: 180 },
  { direction: "right", speed: 18, height: 150 },
  { direction: "left", speed: 35, height: 170 },
];

type WallSectionProps = {
  items: WallItem[];
};

/**
 * Full-viewport wall of generation images in horizontal conveyor rows.
 * Distributes items across rows, duplicates aggressively for density.
 * Dark background for contrast with the floating overlay.
 */
export function WallSection({ items }: WallSectionProps) {
  // Use more rows when we have more items
  const rowCount = items.length >= 20 ? 5 : items.length >= 10 ? 4 : 3;
  const configs = ROW_CONFIGS.slice(0, rowCount);

  // Distribute items round-robin across rows
  const rows: WallItem[][] = Array.from({ length: rowCount }, () => []);
  items.forEach((item, i) => {
    rows[i % rowCount].push(item);
  });

  // Ensure each row has enough items for a seamless loop
  // Need enough to overflow viewport width (at ~250px per card, need ~8+ for 1440px viewport)
  // Double that for the seamless loop technique = 16+ items minimum
  const filledRows = rows.map((row) => {
    if (row.length === 0) return [];
    let filled = [...row];
    while (filled.length < 16) {
      filled = [...filled, ...row];
    }
    return filled;
  });

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col justify-center gap-1 overflow-hidden bg-ink">
      {/* Conveyor rows */}
      {filledRows.map((rowItems, i) => (
        <ConveyorRow
          key={i}
          items={rowItems}
          direction={configs[i].direction}
          speed={configs[i].speed}
          height={configs[i].height}
          eager={i === 0}
          rowIndex={i}
        />
      ))}

      {/* Subtle gradient overlays for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/60" />

      {/* Floating overlay with tagline + CTA */}
      <FloatingOverlay />
    </section>
  );
}
