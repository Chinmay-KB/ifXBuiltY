"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui";
import { useCreditProduct } from "@/hooks/use-credit-product";
import { cn } from "@/lib/cn";

type CreditsModalProps = {
  open: boolean;
  onClose: () => void;
  currentCredits?: number | null;
};

export function CreditsModal({ open, onClose, currentCredits = null }: CreditsModalProps) {
  const [loading, setLoading] = useState(false);
  const {
    product,
    priceLabel,
    creditsLabel,
    loading: productLoading,
  } = useCreditProduct();

  const handleBuy = useCallback(async () => {
    if (!product) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.productId }),
      });

      if (!res.ok) {
        // TODO: show error state
        return;
      }

      const data = await res.json();
      if (data.sessionId) {
        window.localStorage.setItem(
          "ifxb_dodo_checkout_session_id",
          data.sessionId,
        );
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }, [product]);

  if (!open) return null;
  const isOutOfCredits = currentCredits == null ? true : currentCredits <= 0;
  const title = isOutOfCredits ? "You're out of credits" : "Top up your credits";
  const description = isOutOfCredits
    ? "Grab more credits to keep exploring parallel universes. Each generation uses 1 credit."
    : `You still have ${currentCredits} credit${currentCredits === 1 ? "" : "s"}. Stock up now so you can keep generating without interruption.`;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-modal-title"
    >
      <div className="flex w-full max-w-[440px] flex-col gap-6 rounded-[20px] bg-canvas p-9 shadow-modal">
        {/* Header */}
        <div className="flex items-start justify-end">
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg bg-panel text-muted transition-colors hover:bg-line hover:text-ink"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 3L11 11M11 3L3 11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-2">
          <h2
            id="credits-modal-title"
            className="font-display text-[26px] font-black leading-tight tracking-tight text-ink"
          >
            {title}
          </h2>
          <p className="text-[15px] leading-relaxed text-muted">
            {description}
          </p>
        </div>

        {/* Credit pack info */}
        <div className="flex flex-col gap-3">
          {productLoading ? (
            <div className="flex items-center justify-between rounded-xl border-2 border-chrome bg-panel px-5 py-[18px]">
              <div className="flex flex-col gap-1">
                <span className="text-[17px] font-bold text-ink">Loading…</span>
                <span className="text-[13px] text-muted">Fetching product info</span>
              </div>
            </div>
          ) : product ? (
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border-2 border-chrome bg-panel px-5 py-[18px]",
              )}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[17px] font-bold text-ink">
                  {creditsLabel}
                </span>
                {product.description ? (
                  <span className="text-[13px] text-muted">
                    {product.description}
                  </span>
                ) : (
                  <span className="text-[13px] text-muted">
                    {product.creditsGranted} generations
                  </span>
                )}
              </div>
              <span className="text-xl font-bold text-ink">{priceLabel}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border-2 border-line bg-canvas px-5 py-[18px]">
              <span className="text-[15px] text-muted">
                Unable to load pricing. Try again later.
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Button
            variant="chrome"
            size="lg"
            className="w-full"
            onClick={() => void handleBuy()}
            disabled={loading || productLoading || !product}
          >
            {loading ? "Redirecting…" : "Buy credits"}
          </Button>
          <p className="text-center text-[13px] text-muted">
            Secure payment via Dodo Payments. No subscription required.
          </p>
        </div>
      </div>
    </div>
  );
}
