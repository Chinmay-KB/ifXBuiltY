"use client";

import { createDeferredVercelWidget } from "@/components/deferred-vercel-widget";

export const DeferredAnalytics = createDeferredVercelWidget(
  () =>
    import("@vercel/analytics/next").then((mod) => ({ default: mod.Analytics })),
  3500,
);
