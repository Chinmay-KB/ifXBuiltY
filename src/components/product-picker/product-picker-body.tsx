"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  filterProfileGroups,
  type GeneratorProfileGroup,
  type GeneratorProfileOption,
} from "@/data/generator-profile-options";
import { cn } from "@/lib/cn";
import { formatScreenBadge } from "@/lib/screen-type";

import { companyNameForOption, pickerTitle, productCountForGroup } from "./utils";

type ProductPickerBodyProps = {
  field: "builder" | "target";
  groups: GeneratorProfileGroup[];
  valueId: string;
  onSelect: (option: GeneratorProfileOption) => void;
  onPeekCompany?: (companyId: string) => void;
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M5 12l5 5 9-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductPickerBody({
  field,
  groups,
  valueId,
  onSelect,
  onPeekCompany,
}: ProductPickerBodyProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");

  const selected = useMemo(() => {
    for (const g of groups) {
      const hit = g.options.find((o) => o.id === valueId);
      if (hit) return { option: hit, group: g };
    }
    return null;
  }, [groups, valueId]);

  const initialCompanyId =
    selected?.group.companyId ?? groups[0]?.companyId ?? "";
  const [activeCompanyId, setActiveCompanyId] = useState(initialCompanyId);

  useEffect(() => {
    if (selected?.group.companyId) {
      setActiveCompanyId(selected.group.companyId);
    }
  }, [selected?.group.companyId]);

  const searchQuery = search.trim();
  const isSearching = searchQuery.length > 0;

  const searchResults = useMemo(
    () => (isSearching ? filterProfileGroups(groups, { search: searchQuery }) : groups),
    [groups, isSearching, searchQuery],
  );

  const activeGroup = useMemo(
    () => groups.find((g) => g.companyId === activeCompanyId) ?? groups[0],
    [groups, activeCompanyId],
  );

  const browseProducts = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.options.filter((o) => o.profileType === "product");
  }, [activeGroup]);

  const { label, headline } = pickerTitle(field);
  const totalCompanies = groups.length;
  const totalProducts = groups.reduce((n, g) => n + productCountForGroup(g), 0);

  const handlePeek = useCallback(
    (companyId: string) => {
      setSearch("");
      setActiveCompanyId(companyId);
      onPeekCompany?.(companyId);
      searchRef.current?.blur();
    },
    [onPeekCompany],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-line px-5 pb-4 pt-5 md:px-7 md:pt-7">
        <div className="mb-4 flex flex-col gap-1">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            {label}
          </p>
          <p className="font-display text-[32px] font-black italic leading-none tracking-[-0.02em] text-ink md:text-[36px]">
            {headline}
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-xl bg-panel px-4 py-3.5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 text-muted"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M20 20l-3.5-3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${totalCompanies} companies, ${totalProducts}+ products…`}
            className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
            aria-label="Search companies and products"
          />
          <kbd className="hidden shrink-0 rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] font-bold text-muted md:inline">
            ⌘K
          </kbd>
        </label>
      </div>

      {isSearching ? (
        <SearchResults
          results={searchResults}
          valueId={valueId}
          onSelect={onSelect}
          onPeek={handlePeek}
        />
      ) : (
        <>
          {/* Mobile: company chips */}
          <div className="flex shrink-0 gap-2 overflow-x-auto px-5 pb-2 pt-4 md:hidden">
            {groups.map((g) => {
              const active = g.companyId === activeCompanyId;
              const count = productCountForGroup(g);
              return (
                <button
                  key={g.companyId}
                  type="button"
                  onClick={() => setActiveCompanyId(g.companyId)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "border-ink bg-chrome text-ink"
                      : "border-line bg-canvas text-ink",
                  )}
                >
                  {g.companyName}
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold",
                      active ? "text-ink" : "text-muted",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Desktop: company rail */}
            <div className="hidden w-[280px] shrink-0 flex-col overflow-y-auto border-r border-line py-4 md:flex">
              <div className="flex items-center justify-between px-6 pb-3 pt-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  Companies
                </span>
                <span className="font-mono text-[10px] text-muted">{totalCompanies}</span>
              </div>
              <div className="flex flex-col">
                {groups.map((g) => {
                  const active = g.companyId === activeCompanyId;
                  const count = productCountForGroup(g);
                  return (
                    <button
                      key={g.companyId}
                      type="button"
                      onClick={() => setActiveCompanyId(g.companyId)}
                      className={cn(
                        "relative flex items-center gap-3 px-6 py-3 text-left transition-colors",
                        active ? "bg-chrome" : "hover:bg-panel",
                      )}
                    >
                      {active ? (
                        <span className="absolute inset-y-0 left-0 w-1 bg-ink" aria-hidden />
                      ) : null}
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-[15px] font-medium",
                          active ? "font-bold text-ink" : "text-ink",
                        )}
                      >
                        {g.companyName}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[11px]",
                          active ? "font-bold text-ink" : "text-muted",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products pane */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 md:p-7">
              <div className="mb-4 flex flex-col gap-1.5 md:mb-5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  Products by
                </p>
                <p className="font-display text-[28px] font-black italic leading-none tracking-[-0.02em] text-ink md:text-[32px]">
                  {activeGroup?.companyName ?? "—"}
                </p>
              </div>

              {/* Mobile list */}
              <div className="flex flex-col gap-2 md:hidden">
                {browseProducts.map((opt) => (
                  <ProductRow
                    key={opt.id}
                    option={opt}
                    selected={opt.id === valueId}
                    onSelect={() => onSelect(opt)}
                  />
                ))}
                {browseProducts.length === 0 && activeGroup ? (
                  <CompanyOnlyRow
                    option={activeGroup.options.find((o) => o.profileType === "company")!}
                    selected={
                      activeGroup.options.find((o) => o.profileType === "company")?.id ===
                      valueId
                    }
                    onSelect={() => {
                      const co = activeGroup.options.find((o) => o.profileType === "company");
                      if (co) onSelect(co);
                    }}
                  />
                ) : null}
              </div>

              {/* Desktop grid */}
              <div className="hidden flex-wrap content-start gap-3 md:flex">
                {browseProducts.map((opt) => (
                  <ProductCard
                    key={opt.id}
                    option={opt}
                    selected={opt.id === valueId}
                    onSelect={() => onSelect(opt)}
                  />
                ))}
                {browseProducts.length === 0 && activeGroup ? (
                  <ProductCard
                    option={
                      activeGroup.options.find((o) => o.profileType === "company") ??
                      activeGroup.options[0]!
                    }
                    selected={valueId === activeGroup.companyId}
                    onSelect={() => {
                      const co =
                        activeGroup.options.find((o) => o.profileType === "company") ??
                        activeGroup.options[0];
                      if (co) onSelect(co);
                    }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductCard({
  option,
  selected,
  onSelect,
}: {
  option: GeneratorProfileOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const badge = formatScreenBadge(option.screenType);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-60 flex-col gap-3 rounded-[14px] p-4.5 text-left transition-colors",
        selected
          ? "border-[1.5px] border-ink bg-canvas"
          : "border border-line bg-canvas hover:border-line-strong",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
          {badge}
        </span>
        {selected ? (
          <span className="flex size-[18px] items-center justify-center rounded-full bg-chrome">
            <CheckIcon className="text-ink" />
          </span>
        ) : (
          <span className="size-1.5 rounded-full bg-line" aria-hidden />
        )}
      </div>
      <span className="font-display text-[22px] font-bold italic leading-[105%] tracking-[-0.01em] text-ink">
        {option.name}
      </span>
    </button>
  );
}

function ProductRow({
  option,
  selected,
  onSelect,
}: {
  option: GeneratorProfileOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const badge = formatScreenBadge(option.screenType);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3.5 text-left",
        selected ? "border-[1.5px] border-ink bg-canvas" : "bg-transparent",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-display text-[20px] font-bold italic leading-none text-ink">
          {option.name}
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          {badge}
        </p>
      </div>
      {selected ? (
        <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-chrome">
          <CheckIcon className="text-ink" />
        </span>
      ) : (
        <span className="size-2 shrink-0 rounded-full bg-line" aria-hidden />
      )}
    </button>
  );
}

function CompanyOnlyRow({
  option,
  selected,
  onSelect,
}: {
  option: GeneratorProfileOption;
  selected: boolean;
  onSelect: () => void;
}) {
  if (!option) return null;
  return (
    <ProductRow option={option} selected={selected} onSelect={onSelect} />
  );
}

function SearchResults({
  results,
  valueId,
  onSelect,
  onPeek,
}: {
  results: GeneratorProfileGroup[];
  valueId: string;
  onSelect: (option: GeneratorProfileOption) => void;
  onPeek: (companyId: string) => void;
}) {
  const flat = results.flatMap((g) =>
    g.options.map((opt) => ({ opt, group: g })),
  );

  if (flat.length === 0) {
    return (
      <p className="px-7 py-8 text-center text-sm text-muted">No matches found.</p>
    );
  }

  const firstCompanyId = flat[0]?.group.companyId;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-7">
      {results.map((group) => (
        <div key={group.companyId} className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              {group.companyName}
            </p>
            {group.companyId === firstCompanyId ? (
              <button
                type="button"
                onClick={() => onPeek(group.companyId)}
                className="rounded-md bg-chrome px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-ink"
              >
                Peek
              </button>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            {group.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelect(opt)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-panel",
                  opt.id === valueId && "bg-panel",
                )}
              >
                <div>
                  <p className="text-[15px] font-medium text-ink">{opt.name}</p>
                  <p className="font-mono text-[10px] text-muted">
                    {formatScreenBadge(opt.screenType)}
                    {opt.profileType === "product"
                      ? ` · ${companyNameForOption(results, opt)}`
                      : ""}
                  </p>
                </div>
                {opt.id === valueId ? (
                  <span className="flex size-4 items-center justify-center rounded-full bg-chrome">
                    <CheckIcon className="text-ink" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
