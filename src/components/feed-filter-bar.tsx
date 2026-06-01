"use client";

import { useCallback } from "react";

import { CompanyProductFilterDropdown } from "@/components/company-product-filter-dropdown";
import { cn } from "@/lib/cn";
import type {
  FeedProfileFilterGroup,
  FeedProfileFilterPick,
} from "@/lib/feed-profile-filter";
import type { FeedSort } from "@/lib/feed-types";
import { VIBE_TAGS } from "@/lib/vibe-tags";

type FeedFilterBarProps = {
  currentSort: FeedSort;
  builderGroups: FeedProfileFilterGroup[];
  targetGroups: FeedProfileFilterGroup[];
  selectedBuilderPicks: FeedProfileFilterPick[];
  selectedTargetPicks: FeedProfileFilterPick[];
  onSortChange: (sort: FeedSort) => void;
  onBuilderPicksChange: (picks: FeedProfileFilterPick[]) => void;
  onTargetPicksChange: (picks: FeedProfileFilterPick[]) => void;
  /** Paper signage styling (Desktop Feed v2) */
  variant?: "default" | "paper";
};

const sortOptions: { value: FeedSort; label: string }[] = [
  { value: "newest", label: "Latest generations" },
  { value: "trending", label: "Trending" },
];

export const FEED_VIBE_OPTIONS = VIBE_TAGS;

export function FeedFilterBar({
  currentSort,
  builderGroups,
  targetGroups,
  selectedBuilderPicks,
  selectedTargetPicks,
  onSortChange,
  onBuilderPicksChange,
  onTargetPicksChange,
  variant = "default",
}: FeedFilterBarProps) {
  const handleSortChange = useCallback(
    (sort: FeedSort) => {
      onSortChange(sort);
    },
    [onSortChange],
  );

  const isPaper = variant === "paper";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:gap-4",
        isPaper && "border-b border-t border-line py-3 lg:px-10",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
          isPaper && "px-4 sm:px-6 lg:px-0",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-1.5",
            isPaper
              ? "scrollbar-none overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden"
              : "flex-wrap",
            !isPaper && "gap-1 rounded-tile bg-panel p-1 sm:rounded-tile",
          )}
          role="tablist"
          aria-label="Sort options"
        >
          {sortOptions.map((option) => {
            const isActive = currentSort === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSortChange(option.value)}
                className={cn(
                  "min-h-[44px] rounded-full px-3.5 py-1.75 transition-colors duration-200 sm:min-h-0",
                  isPaper && "shrink-0 whitespace-nowrap",
                  isPaper &&
                    (isActive
                      ? "bg-ink font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-chrome"
                      : "font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted hover:text-ink"),
                  !isPaper &&
                    (isActive
                      ? "rounded-md bg-canvas font-sans text-sm font-semibold text-ink shadow-sm"
                      : "rounded-md font-sans text-sm text-muted hover:text-ink"),
                )}
              >
                {isPaper ? option.label.toUpperCase() : option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          isPaper && "border-t border-line px-4 pt-3 sm:px-6 lg:border-t-0 lg:px-0 lg:pt-0",
        )}
      >
        <CompanyProductFilterDropdown
          label="Builder"
          groups={builderGroups}
          selected={selectedBuilderPicks}
          onChange={onBuilderPicksChange}
        />
        <CompanyProductFilterDropdown
          label="Target"
          groups={targetGroups}
          selected={selectedTargetPicks}
          onChange={onTargetPicksChange}
        />
      </div>
    </div>
  );
}
