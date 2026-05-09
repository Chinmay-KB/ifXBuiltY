"use client";

import { useVote } from "@/hooks/use-vote";
import { formatCompactCount } from "@/lib/ui/format";

type VoteControlsProps = {
  generationId: number;
  initialScore: number;
  initialUserVote: 1 | -1 | null;
  compact?: boolean; // true for card, false for detail page
};

/**
 * VoteControls — upvote/downvote buttons with compact score display.
 * Wired to the useVote hook for optimistic updates.
 *
 * - compact mode: smaller buttons, inline layout for cards
 * - non-compact mode: larger buttons for detail page
 *
 * Validates: Requirements 1.3, 1.7
 */
export function VoteControls({
  generationId,
  initialScore,
  initialUserVote,
  compact = true,
}: VoteControlsProps) {
  const { score, userVote, vote, isPending } = useVote({
    generationId,
    initialScore,
    initialUserVote,
  });

  const buttonSize = compact ? "size-8" : "size-11";
  const iconSize = compact ? "w-3.5 h-3.5" : "w-5 h-5";
  const scoreText = compact ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => vote(1)}
        className={`${buttonSize} flex items-center justify-center rounded-md transition-colors duration-[var(--transition-duration-default)] disabled:opacity-50 ${
          userVote === 1
            ? "bg-vote text-white"
            : "bg-panel text-ink hover:bg-vote/10"
        }`}
        aria-label="Upvote"
        aria-pressed={userVote === 1}
      >
        <svg
          className={iconSize}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 3L3 10h10L8 3z" />
        </svg>
      </button>

      <span className={`${scoreText} min-w-[2ch] text-center font-bold text-ink`}>
        {formatCompactCount(score)}
      </span>

      <button
        type="button"
        disabled={isPending}
        onClick={() => vote(-1)}
        className={`${buttonSize} flex items-center justify-center rounded-md transition-colors duration-[var(--transition-duration-default)] disabled:opacity-50 ${
          userVote === -1
            ? "bg-barrier text-white"
            : "bg-panel text-ink hover:bg-barrier/10"
        }`}
        aria-label="Downvote"
        aria-pressed={userVote === -1}
      >
        <svg
          className={iconSize}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 13L3 6h10L8 13z" />
        </svg>
      </button>
    </div>
  );
}
