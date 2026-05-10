"use client";

import { useCallback, useEffect, useState } from "react";

type CreditsState = {
  credits: number | null;
  isLoading: boolean;
  error: string | null;
  hasCustomer: boolean;
};

type UseCreditsReturn = CreditsState & {
  refresh: () => Promise<void>;
  /** Whether the user has 0 credits and should see the paywall */
  needsCredits: boolean;
};

/**
 * useCredits — fetches and caches the user's credit balance.
 * Call `refresh()` after a purchase or generation to update.
 */
export function useCredits(signedIn: boolean): UseCreditsReturn {
  const [state, setState] = useState<CreditsState>({
    credits: null,
    isLoading: false,
    error: null,
    hasCustomer: false,
  });

  const refresh = useCallback(async () => {
    if (!signedIn) {
      setState({ credits: null, isLoading: false, error: null, hasCustomer: false });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch("/api/credits/balance");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: (body as { error?: string }).error ?? "Failed to load credits",
        }));
        return;
      }

      const data = await res.json();
      setState({
        credits: data.credits ?? 0,
        isLoading: false,
        error: null,
        hasCustomer: data.hasCustomer ?? false,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Network error loading credits",
      }));
    }
  }, [signedIn]);

  // Fetch on mount when signed in
  useEffect(() => {
    if (!signedIn) return;

    let cancelled = false;

    async function fetchCredits() {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const res = await fetch("/api/credits/balance");
        if (cancelled) return;

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: (body as { error?: string }).error ?? "Failed to load credits",
          }));
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        setState({
          credits: data.credits ?? 0,
          isLoading: false,
          error: null,
          hasCustomer: data.hasCustomer ?? false,
        });
      } catch {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Network error loading credits",
        }));
      }
    }

    void fetchCredits();
    return () => { cancelled = true; };
  }, [signedIn]);

  const needsCredits =
    signedIn && state.credits !== null && state.credits <= 0;

  return { ...state, refresh, needsCredits };
}
