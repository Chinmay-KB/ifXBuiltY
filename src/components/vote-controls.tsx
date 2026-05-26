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

  const buttonSize = compact ? "size-8 rounded-md" : "size-10 rounded-full";
  const iconSize = compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5";
  const scoreText = compact ? "text-sm" : "text-sm";
  const controlWrap = compact
    ? "flex items-center gap-1.5"
    : "inline-flex items-center gap-2";
  const scoreWrap = compact
    ? "min-w-[2ch] text-center font-bold text-ink"
    : "min-w-[3ch] px-1 text-center font-mono text-[12px] font-bold text-ink";
  const interactionFx =
    "transition-all duration-(--transition-duration-default) ease-out motion-safe:hover:-translate-y-[1px] motion-safe:hover:scale-[1.03] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.96]";

  return (
    <div className={controlWrap}>
      <button
        type="button"
        disabled={isPending}
        onClick={() => vote(1)}
        className={`${buttonSize} ${interactionFx} flex items-center justify-center border border-line-strong disabled:opacity-50 ${
          userVote === 1
            ? "bg-chrome text-ink shadow-[0_6px_16px_-12px_rgba(248,208,0,0.95)]"
            : "bg-canvas text-muted hover:bg-panel hover:text-ink"
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

      <span className={`${scoreText} ${scoreWrap}`}>{formatCompactCount(score)}</span>

      <button
        type="button"
        disabled={isPending}
        onClick={() => vote(-1)}
        className={`${buttonSize} ${interactionFx} flex items-center justify-center border border-line-strong disabled:opacity-50 ${
          userVote === -1
            ? "bg-ink text-white shadow-[0_8px_20px_-14px_rgba(0,0,0,0.9)]"
            : "bg-canvas text-muted hover:bg-panel hover:text-ink"
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
