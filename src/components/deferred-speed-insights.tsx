"use client";

import dynamic from "next/dynamic";

import { useDeferUntilIdle } from "@/lib/defer-until-idle";

const SpeedInsights = dynamic(
  () =>
    import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
  { ssr: false },
);

export function DeferredSpeedInsights() {
  const ready = useDeferUntilIdle(4000);
  if (!ready) return null;
  return <SpeedInsights />;
}
