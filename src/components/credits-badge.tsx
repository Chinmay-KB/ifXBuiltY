"use client";

import { useCallback, useEffect, useState } from "react";

import { CreditsModal } from "@/components/credits-modal";
import { onCreditsChanged } from "@/lib/credits-events";

/**
 * Displays the user's credit balance as a small badge in the nav.
 * Fetches from /api/credits/balance on mount and re-fetches whenever
 * any component emits a credits-changed event.
 */
export function CreditsBadge() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

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

  // Re-fetch when any component signals that credits changed
  useEffect(() => {
    return onCreditsChanged(() => {
      void fetchBalance();
    });
  }, [fetchBalance]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-ink py-2 px-3">
        <div className="size-1.5 animate-pulse rounded-full bg-chrome" />
        <div className="h-3 w-14 animate-pulse rounded bg-line" />
      </div>
    );
  }

  if (credits == null) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowCreditsModal(true)}
        className="flex items-center gap-1.5 rounded-full border border-ink py-2 px-3 font-mono text-[11px] font-bold text-ink transition-colors hover:bg-line/60"
        title={`${credits} credit${credits === 1 ? "" : "s"} remaining. Tap to buy more.`}
        aria-label={`You have ${credits} credit${credits === 1 ? "" : "s"}. Buy more credits.`}
      >
        <span className="size-1.5 shrink-0 rounded-full bg-chrome" aria-hidden />
        <span>
          {credits} credit{credits === 1 ? "" : "s"}
        </span>
      </button>
      <CreditsModal
        open={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        currentCredits={credits}
      />
    </>
  );
}
