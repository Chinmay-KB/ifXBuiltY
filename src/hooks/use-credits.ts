"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchCreditsBalance } from "@/lib/credits/fetch-balance";
import { emitCreditsChanged, onCreditsChanged } from "@/lib/credits-events";

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
 * Call `refresh()` after a purchase or generation to update peers via credits-changed events.
 */
export function useCredits(signedIn: boolean): UseCreditsReturn {
  const [state, setState] = useState<CreditsState>(() => ({
    credits: null,
    isLoading: signedIn,
    error: null,
    hasCustomer: false,
  }));

  const load = useCallback(
    async (opts?: { notifyPeers?: boolean }) => {
      if (!signedIn) {
        setState({
          credits: null,
          isLoading: false,
          error: null,
          hasCustomer: false,
        });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await fetchCreditsBalance();
      if (!result.ok) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.unauthorized ? null : result.error,
          credits: result.unauthorized ? null : prev.credits,
        }));
        return;
      }

      setState({
        credits: result.data.credits,
        isLoading: false,
        error: null,
        hasCustomer: result.data.hasCustomer,
      });

      if (opts?.notifyPeers) {
        emitCreditsChanged();
      }
    },
    [signedIn],
  );

  const refresh = useCallback(async () => {
    await load({ notifyPeers: true });
  }, [load]);

  useEffect(() => {
    if (!signedIn) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial balance fetch on sign-in
    void load();
  }, [signedIn, load]);

  useEffect(() => {
    if (!signedIn) return;
    return onCreditsChanged(() => {
      void load();
    });
  }, [signedIn, load]);

  const needsCredits =
    signedIn && state.credits !== null && state.credits <= 0;

  return { ...state, refresh, needsCredits };
}
