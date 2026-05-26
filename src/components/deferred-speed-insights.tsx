"use client";

import { createDeferredVercelWidget } from "@/components/deferred-vercel-widget";

export const DeferredSpeedInsights = createDeferredVercelWidget(
  () =>
    import("@vercel/speed-insights/next").then((mod) => ({
      default: mod.SpeedInsights,
    })),
  4000,
);
