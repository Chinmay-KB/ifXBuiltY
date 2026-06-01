export type CreditsBalanceResponse = {
  credits: number;
  hasCustomer: boolean;
};

export type CreditsBalanceFetchResult =
  | { ok: true; data: CreditsBalanceResponse }
  | { ok: false; unauthorized: boolean; error: string };

/**
 * Fetches the signed-in user's credit balance from `/api/credits/balance`.
 */
export async function fetchCreditsBalance(): Promise<CreditsBalanceFetchResult> {
  try {
    const res = await fetch("/api/credits/balance");
    if (res.status === 401) {
      return { ok: false, unauthorized: true, error: "Unauthorized" };
    }

    const body = (await res.json().catch(() => ({}))) as {
      credits?: number;
      hasCustomer?: boolean;
      error?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        unauthorized: false,
        error: body.error ?? "Failed to load credits",
      };
    }

    return {
      ok: true,
      data: {
        credits: typeof body.credits === "number" ? body.credits : 0,
        hasCustomer: body.hasCustomer ?? false,
      },
    };
  } catch {
    return {
      ok: false,
      unauthorized: false,
      error: "Network error loading credits",
    };
  }
}
