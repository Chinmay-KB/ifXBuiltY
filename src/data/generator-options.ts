/**
 * Dropdown options for the generator form.
 * Options come from company-profiles.json with products nested under parent companies.
 */

import companyProfiles from "./company-profiles.json";

export type ProductOption = {
  id: string;
  name: string;
  screenType: string;
};

export type CompanyOption = {
  id: string;
  name: string;
  products: ProductOption[];
};

/** All available options grouped by company */
export const GENERATOR_OPTIONS: CompanyOption[] = companyProfiles.map((c) => ({
  id: c.id,
  name: c.name,
  products: (c.products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    screenType: p.screenType ?? "",
  })),
}));

/** Flat list of all selectable entries (company + products) for simple selects */
export type FlatOption = { id: string; name: string; groupId?: string };

export const FLAT_OPTIONS: FlatOption[] = GENERATOR_OPTIONS.flatMap((group) => {
  const items: FlatOption[] = [{ id: group.id, name: group.name, groupId: group.id }];
  for (const p of group.products) {
    if (p.id === group.id) continue;
    items.push({ id: p.id, name: `${group.name} — ${p.name}`, groupId: group.id });
  }
  return items;
});

/** Backward-compatible: flat company-only list (legacy) */
export const BUILDER_OPTIONS = GENERATOR_OPTIONS.map((c) => ({ id: c.id, name: c.name }));
export const TARGET_OPTIONS = GENERATOR_OPTIONS.map((c) => ({ id: c.id, name: c.name }));
