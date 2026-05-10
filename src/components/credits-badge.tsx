"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Displays the user's credit balance as a small badge in the nav.
 * Fetches from /api/credits/balance on mount.
 */
export function CreditsBadge() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/credits/balance");
      if (!res.ok) {
        setCredits(null);
        return;
      }
      const data = await res.json();
      setCredits(typeof data.credits === "number" ? data.credits : null);
    } catch {
      setCredits(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5">
        <div className="size-3.5 animate-pulse rounded-full bg-line" />
        <div className="h-3 w-5 animate-pulse rounded bg-line" />
      </div>
    );
  }

  if (credits == null) return null;

  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-xs font-semibold text-ink"
      title={`${credits} credit${credits === 1 ? "" : "s"} remaining`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
        className="text-chrome"
      >
        <path
          d="M11 2L13.5 7.5L19 8.5L15 12.5L16 18L11 15.5L6 18L7 12.5L3 8.5L8.5 7.5L11 2Z"
          fill="currentColor"
        />
      </svg>
      <span>{credits}</span>
    </div>
  );
}
