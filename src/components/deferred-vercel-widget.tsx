"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { useDeferUntilIdle } from "@/lib/defer-until-idle";

export function createDeferredVercelWidget(
  load: () => Promise<{ default: ComponentType }>,
  idleTimeoutMs: number,
) {
  const Widget = dynamic(load, { ssr: false });

  return function DeferredVercelWidget() {
    const ready = useDeferUntilIdle(idleTimeoutMs);
    if (!ready) return null;
    return <Widget />;
  };
}
