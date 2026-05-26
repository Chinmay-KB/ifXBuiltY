/** A single builder or target filter pick (company-wide or one product). */
export type FeedProfileFilterPick =
  | { kind: "company"; companyId: string }
  | { kind: "product"; companyId: string; productId: string };

export type FeedProfileFilterProduct = {
  id: string;
  name: string;
};

/** Company + approved products for feed filter UI and name expansion. */
export type FeedProfileFilterGroup = {
  companyId: string;
  companyName: string;
  products: FeedProfileFilterProduct[];
};

export type FeedHierarchicalFilterOptions = {
  builderGroups: FeedProfileFilterGroup[];
  targetGroups: FeedProfileFilterGroup[];
};

function pickKey(pick: FeedProfileFilterPick): string {
  return pick.kind === "company"
    ? `company:${pick.companyId}`
    : `product:${pick.companyId}:${pick.productId}`;
}

export function isSameFeedProfilePick(
  a: FeedProfileFilterPick,
  b: FeedProfileFilterPick,
): boolean {
  return pickKey(a) === pickKey(b);
}

export function hasFeedProfilePick(
  picks: FeedProfileFilterPick[],
  pick: FeedProfileFilterPick,
): boolean {
  return picks.some((p) => isSameFeedProfilePick(p, pick));
}

/** Remove company-level and product picks for a company. */
export function clearCompanyPicks(
  picks: FeedProfileFilterPick[],
  companyId: string,
): FeedProfileFilterPick[] {
  return picks.filter((p) => p.companyId !== companyId);
}

/**
 * Expand profile picks into generation `builder` / `target` name strings.
 * Company-only picks include the company name plus all child product names.
 */
export function expandProfileSelectionsToNames(
  picks: FeedProfileFilterPick[],
  groups: FeedProfileFilterGroup[],
): string[] {
  const groupById = new Map(groups.map((g) => [g.companyId, g]));
  const names = new Set<string>();

  for (const pick of picks) {
    const group = groupById.get(pick.companyId);
    if (!group) continue;

    if (pick.kind === "company") {
      names.add(group.companyName);
      for (const product of group.products) {
        names.add(product.name);
      }
      continue;
    }

    const product = group.products.find((p) => p.id === pick.productId);
    if (product) names.add(product.name);
  }

  return Array.from(names);
}

export function formatFeedProfileFilterButtonLabel(
  label: string,
  picks: FeedProfileFilterPick[],
  groups: FeedProfileFilterGroup[],
): string {
  if (picks.length === 0) return label;
  if (picks.length === 1) {
    const group = groups.find((g) => g.companyId === picks[0]!.companyId);
    if (!group) return label;
    const first = picks[0]!;
    if (first.kind === "company") {
      return `${group.companyName} (all)`;
    }
    const product = group.products.find((p) => p.id === first.productId);
    return product?.name ?? label;
  }
  return `${picks.length} selected`;
}
