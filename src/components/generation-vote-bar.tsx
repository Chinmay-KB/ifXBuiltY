"use client";

import { useState } from "react";

import { formatCompactCount } from "@/lib/format-count";

type Props = {
  generationId: number;
  initialUp: number;
  initialDown: number;
};

export function GenerationVoteBar({
  generationId,
  initialUp,
  initialDown,
}: Props) {
  const [up, setUp] = useState(initialUp);
  const [down, setDown] = useState(initialDown);
  const [pending, setPending] = useState<1 | -1 | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function vote(value: 1 | -1) {
    setError(null);
    setPending(value);
    try {
      const res = await fetch(`/api/generations/${generationId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = (await res.json()) as {
        error?: string;
        upvoteCount?: number;
        downvoteCount?: number;
      };
      if (!res.ok) {
        setError(data.error ?? "Vote failed");
        setPending(null);
        return;
      }
      if (typeof data.upvoteCount === "number")
        setUp(data.upvoteCount);
      if (typeof data.downvoteCount === "number")
        setDown(data.downvoteCount);
    } catch {
      setError("Network error");
    }
    setPending(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => void vote(1)}
        className="flex size-11 items-center justify-center rounded-lg bg-vote text-xl font-black text-white shadow-none hover:brightness-110 disabled:opacity-50"
        aria-label="Upvote"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => void vote(-1)}
        className="flex size-11 items-center justify-center rounded-lg border border-line-strong bg-canvas text-xl font-black text-ink hover:bg-panel disabled:opacity-50"
        aria-label="Downvote"
      >
        ↓
      </button>
      <span className="px-2 text-base font-black text-ink">
        {formatCompactCount(up - down)} net
      </span>
      {error ? (
        <span className="text-sm font-medium text-barrier">{error}</span>
      ) : null}
    </div>
  );
}
