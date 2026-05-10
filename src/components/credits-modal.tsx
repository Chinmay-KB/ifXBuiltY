"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

type CreditPack = {
  id: string;
  name: string;
  credits: number;
  price: string;
  description: string;
};

type CreditsModalProps = {
  open: boolean;
  onClose: () => void;
  packs?: CreditPack[];
};

const DEFAULT_PACKS: CreditPack[] = [
  {
    id: "pack-10",
    name: "10 Credits",
    credits: 10,
    price: "$5",
    description: "10 generations",
  },
];

export function CreditsModal({
  open,
  onClose,
  packs = DEFAULT_PACKS,
}: CreditsModalProps) {
  const [selectedPack, setSelectedPack] = useState(packs[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  const handleBuy = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: selectedPack }),
      });

      if (!res.ok) {
        // TODO: show error state
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPack]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-modal-title"
    >
      <div className="flex w-full max-w-[440px] flex-col gap-6 rounded-[20px] bg-canvas p-9 shadow-modal">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex size-11 items-center justify-center rounded-xl bg-chrome">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M11 2L13.5 7.5L19 8.5L15 12.5L16 18L11 15.5L6 18L7 12.5L3 8.5L8.5 7.5L11 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
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
            You&apos;re out of credits
          </h2>
          <p className="text-[15px] leading-relaxed text-muted">
            Grab more credits to keep exploring parallel universes. Each
            generation uses 1 credit.
          </p>
        </div>

        {/* Credit packs */}
        <div className="flex flex-col gap-3">
          {packs.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setSelectedPack(pack.id)}
              className={cn(
                "flex items-center justify-between rounded-xl border-2 px-5 py-[18px] text-left transition-colors",
                selectedPack === pack.id
                  ? "border-chrome bg-panel"
                  : "border-line bg-canvas hover:bg-panel/50",
              )}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[17px] font-bold text-ink">
                  {pack.name}
                </span>
                <span className="text-[13px] text-muted">
                  {pack.description}
                </span>
              </div>
              <span className="text-xl font-bold text-ink">{pack.price}</span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Button
            variant="chrome"
            size="lg"
            className="w-full"
            onClick={() => void handleBuy()}
            disabled={loading}
          >
            {loading ? "Redirecting..." : "Buy credits"}
          </Button>
          <p className="text-center text-[13px] text-muted">
            Secure payment via Stripe. No subscription required.
          </p>
        </div>
      </div>
    </div>
  );
}
