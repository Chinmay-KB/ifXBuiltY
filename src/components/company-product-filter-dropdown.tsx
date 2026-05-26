"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import {
  clearCompanyPicks,
  formatFeedProfileFilterButtonLabel,
  hasFeedProfilePick,
  isSameFeedProfilePick,
  type FeedProfileFilterGroup,
  type FeedProfileFilterPick,
} from "@/lib/feed-profile-filter";

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

type CompanyProductFilterDropdownProps = {
  label: string;
  groups: FeedProfileFilterGroup[];
  selected: FeedProfileFilterPick[];
  onChange: (selected: FeedProfileFilterPick[]) => void;
};

export function CompanyProductFilterDropdown({
  label,
  groups,
  selected,
  onChange,
}: CompanyProductFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState(
    () => groups[0]?.companyId ?? "",
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groups.some((g) => g.companyId === activeCompanyId)) {
      setActiveCompanyId(groups[0]?.companyId ?? "");
    }
  }, [groups, activeCompanyId]);

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

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.companyId === activeCompanyId) ?? groups[0],
    [groups, activeCompanyId],
  );

  const toggleCompanyPick = useCallback(
    (companyId: string) => {
      const pick: FeedProfileFilterPick = { kind: "company", companyId };
      if (hasFeedProfilePick(selected, pick)) {
        onChange(clearCompanyPicks(selected, companyId));
        return;
      }
      onChange([
        ...clearCompanyPicks(selected, companyId),
        pick,
      ]);
    },
    [onChange, selected],
  );

  const toggleProductPick = useCallback(
    (companyId: string, productId: string) => {
      const pick: FeedProfileFilterPick = {
        kind: "product",
        companyId,
        productId,
      };
      if (hasFeedProfilePick(selected, pick)) {
        onChange(selected.filter((p) => !isSameFeedProfilePick(p, pick)));
        return;
      }
      onChange([
        ...clearCompanyPicks(selected, companyId),
        pick,
      ]);
    },
    [onChange, selected],
  );

  const buttonLabel = formatFeedProfileFilterButtonLabel(
    label,
    selected,
    groups,
  );

  const companyPickActive =
    activeGroup &&
    hasFeedProfilePick(selected, {
      kind: "company",
      companyId: activeGroup.companyId,
    });

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex min-h-[44px] items-center gap-1.5 rounded-tile border px-3 py-2 text-sm transition-colors duration-200 sm:min-h-0",
          selected.length > 0
            ? "border-ink bg-ink text-white"
            : "border-line bg-panel text-ink hover:border-line-strong",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="max-w-[140px] truncate">{buttonLabel}</span>
        <ChevronDownIcon
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-40 mt-1.5 flex max-h-72 w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-tile border border-line bg-panel shadow-modal sm:w-[28rem] sm:max-h-80 sm:flex-row"
          role="listbox"
          aria-label={`${label} filter options`}
        >
          <div className="max-h-40 overflow-y-auto border-b border-line sm:max-h-none sm:w-[42%] sm:border-b-0 sm:border-r">
            {groups.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">No options</p>
            ) : (
              groups.map((group) => {
                const isActive = group.companyId === activeCompanyId;
                const companySelected = hasFeedProfilePick(selected, {
                  kind: "company",
                  companyId: group.companyId,
                });
                const productCount = selected.filter(
                  (p) =>
                    p.kind === "product" && p.companyId === group.companyId,
                ).length;

                return (
                  <button
                    key={group.companyId}
                    type="button"
                    onClick={() => setActiveCompanyId(group.companyId)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors duration-200",
                      isActive
                        ? "bg-ink/5 font-medium text-ink"
                        : "text-muted hover:bg-ink/5 hover:text-ink",
                    )}
                  >
                    <span className="truncate">{group.companyName}</span>
                    {(companySelected || productCount > 0) && (
                      <span className="shrink-0 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {companySelected ? "All" : productCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {!activeGroup ? (
              <p className="px-3 py-2 text-sm text-muted">Select a company</p>
            ) : (
              <>
                <button
                  type="button"
                  role="option"
                  aria-selected={companyPickActive}
                  onClick={() => toggleCompanyPick(activeGroup.companyId)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors duration-200",
                    companyPickActive
                      ? "bg-ink/5 font-medium text-ink"
                      : "text-muted hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      companyPickActive
                        ? "border-ink bg-ink text-white"
                        : "border-line-strong bg-canvas",
                    )}
                  >
                    {companyPickActive && <CheckIcon className="size-3" />}
                  </span>
                  <span className="truncate">
                    All {activeGroup.companyName}
                  </span>
                </button>

                {activeGroup.products.length > 0 && (
                  <p className="px-3 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Products
                  </p>
                )}

                {activeGroup.products.map((product) => {
                  const pick: FeedProfileFilterPick = {
                    kind: "product",
                    companyId: activeGroup.companyId,
                    productId: product.id,
                  };
                  const isSelected = hasFeedProfilePick(selected, pick);

                  return (
                    <button
                      key={product.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() =>
                        toggleProductPick(activeGroup.companyId, product.id)
                      }
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
                      <span className="truncate">{product.name}</span>
                    </button>
                  );
                })}
              </>
            )}

            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="mt-1 w-full rounded-md px-3 py-1.5 text-left text-xs font-medium text-muted transition-colors duration-200 hover:text-ink"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
