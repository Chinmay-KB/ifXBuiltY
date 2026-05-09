"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";
import type { FeedSort } from "@/lib/ui/types";

/* ─── Types ─── */

type FeedFilterBarProps = {
  currentSort: FeedSort;
  builders: string[];
  targets: string[];
  selectedBuilders: string[];
  selectedTargets: string[];
  onSortChange: (sort: FeedSort) => void;
  onBuildersChange: (builders: string[]) => void;
  onTargetsChange: (targets: string[]) => void;
};

/* ─── Sort Tabs ─── */

const sortOptions: { value: FeedSort; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "top", label: "Top" },
];

/* ─── Chevron Icon ─── */

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("size-4", className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* ─── Check Icon ─── */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("size-4", className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* ─── Multi-Select Dropdown ─── */

type MultiSelectDropdownProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const toggleOption = useCallback(
    (option: string) => {
      if (selected.includes(option)) {
        onChange(selected.filter((s) => s !== option));
      } else {
        onChange([...selected, option]);
      }
    },
    [selected, onChange],
  );

  const buttonLabel =
    selected.length === 0
      ? label
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex min-h-[44px] items-center gap-1.5 rounded-[7px] border px-3 py-2 text-sm transition-colors duration-200 sm:min-h-0",
          selected.length > 0
            ? "border-ink bg-ink text-white"
            : "border-line bg-panel text-ink hover:border-line-strong",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="max-w-[120px] truncate">{buttonLabel}</span>
        <ChevronDownIcon
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-40 mt-1.5 min-w-[180px] max-h-60 overflow-y-auto rounded-[7px] border border-line bg-panel p-1 shadow-modal"
          role="listbox"
          aria-multiselectable="true"
          aria-label={`${label} filter options`}
        >
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted">No options</p>
          ) : (
            options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors duration-200",
                    isSelected
                      ? "bg-ink/5 font-medium text-ink"
                      : "text-muted hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      isSelected
                        ? "border-ink bg-ink text-white"
                        : "border-line-strong bg-canvas",
                    )}
                  >
                    {isSelected && <CheckIcon className="size-3" />}
                  </span>
                  <span className="truncate">{option}</span>
                </button>
              );
            })
          )}

          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-md px-3 py-1.5 text-left text-xs font-medium text-muted hover:text-ink transition-colors duration-200"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── FeedFilterBar ─── */

export function FeedFilterBar({
  currentSort,
  builders,
  targets,
  selectedBuilders,
  selectedTargets,
  onSortChange,
  onBuildersChange,
  onTargetsChange,
}: FeedFilterBarProps) {
  const router = useRouter();

  // Sync filter state to URL search params
  const syncToUrl = useCallback(
    (sort: FeedSort, builderList: string[], targetList: string[]) => {
      const params = new URLSearchParams();
      params.set("sort", sort);
      if (builderList.length > 0) {
        params.set("builder", builderList.join(","));
      }
      if (targetList.length > 0) {
        params.set("target", targetList.join(","));
      }
      router.push(`/feed?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const handleSortChange = useCallback(
    (sort: FeedSort) => {
      onSortChange(sort);
      syncToUrl(sort, selectedBuilders, selectedTargets);
    },
    [onSortChange, syncToUrl, selectedBuilders, selectedTargets],
  );

  const handleBuildersChange = useCallback(
    (newBuilders: string[]) => {
      onBuildersChange(newBuilders);
      syncToUrl(currentSort, newBuilders, selectedTargets);
    },
    [onBuildersChange, syncToUrl, currentSort, selectedTargets],
  );

  const handleTargetsChange = useCallback(
    (newTargets: string[]) => {
      onTargetsChange(newTargets);
      syncToUrl(currentSort, selectedBuilders, newTargets);
    },
    [onTargetsChange, syncToUrl, currentSort, selectedBuilders],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Sort Tabs */}
      <div
        className="flex items-center gap-1 rounded-[7px] bg-panel p-1"
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
                "rounded-md px-3.5 py-1.5 text-sm transition-colors duration-200 min-h-[44px] sm:min-h-0",
                isActive
                  ? "bg-canvas text-ink font-semibold shadow-sm"
                  : "text-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2">
        <MultiSelectDropdown
          label="Builder"
          options={builders}
          selected={selectedBuilders}
          onChange={handleBuildersChange}
        />
        <MultiSelectDropdown
          label="Target"
          options={targets}
          selected={selectedTargets}
          onChange={handleTargetsChange}
        />
      </div>
    </div>
  );
}
