"use client";

import { useState, useCallback, useRef } from "react";

type VoteValue = 1 | -1 | null;

type UseVoteOptions = {
  generationId: number;
  initialScore: number;
  initialUserVote?: VoteValue;
};

type UseVoteReturn = {
  score: number;
  userVote: VoteValue;
  vote: (value: 1 | -1) => void;
  isPending: boolean;
  error: string | null;
};

/**
 * useVote — optimistic voting hook.
 *
 * Immediately updates the displayed score on vote action, then fires
 * POST /api/generations/[id]/vote. Reverts on server error.
 */
export function useVote({
  generationId,
  initialScore,
  initialUserVote = null,
}: UseVoteOptions): UseVoteReturn {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<VoteValue>(initialUserVote);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track the latest state for the async callback
  const stateRef = useRef({ score, userVote });
  stateRef.current = { score, userVote };

  const vote = useCallback(
    (value: 1 | -1) => {
      if (isPending) return;

      // Capture pre-vote state for rollback
      const prevScore = stateRef.current.score;
      const prevUserVote = stateRef.current.userVote;

      // Calculate optimistic update
      let newScore: number;
      let newUserVote: VoteValue;

      if (prevUserVote === value) {
        // Toggle off: user clicks same direction again → remove vote
        newScore = prevScore - value;
        newUserVote = null;
      } else if (prevUserVote === null) {
        // Fresh vote: no previous vote → add vote
        newScore = prevScore + value;
        newUserVote = value;
      } else {
        // Opposite direction: swing by 2 (remove old + add new)
        newScore = prevScore + value * 2;
        newUserVote = value;
      }

      // Apply optimistic update
      setScore(newScore);
      setUserVote(newUserVote);
      setIsPending(true);
      setError(null);

      // Fire API request
      fetch(`/api/generations/${generationId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Vote failed");
          }
          // Success — optimistic state is now confirmed
          return res.json();
        })
        .then(() => {
          setError(null);
        })
        .catch(() => {
          // Revert to pre-vote state
          setScore(prevScore);
          setUserVote(prevUserVote);
          setError("Vote failed");
        })
        .finally(() => {
          setIsPending(false);
        });
    },
    [generationId, isPending],
  );

  return { score, userVote, vote, isPending, error };
}
