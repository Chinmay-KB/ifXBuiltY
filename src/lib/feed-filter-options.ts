import { unstable_cache } from "next/cache";

import { getSelectableCompanyGroups } from "@/data/company-profiles";
import type {
  FeedHierarchicalFilterOptions,
  FeedProfileFilterGroup,
} from "@/lib/feed-profile-filter";

const FILTER_OPTIONS_REVALIDATE_SECONDS = 60 * 60;

function mapSelectableGroupsToFilterGroups(
  companyGroups: Awaited<ReturnType<typeof getSelectableCompanyGroups>>,
): FeedProfileFilterGroup[] {
  return companyGroups.map((group) => ({
    companyId: group.company.id,
    companyName: group.company.name,
    products: group.products.map((p) => ({ id: p.id, name: p.name })),
  }));
}

/**
 * Builder/target filter options from the current generator catalog only
 * (approved companies + products), not historical generation strings.
 */
async function fetchFeedHierarchicalFilterOptions(): Promise<FeedHierarchicalFilterOptions> {
  const companyGroups = await getSelectableCompanyGroups();
  const groups = mapSelectableGroupsToFilterGroups(companyGroups);

  return {
    builderGroups: groups,
    targetGroups: groups,
  };
}

export const getFeedHierarchicalFilterOptions = unstable_cache(
  fetchFeedHierarchicalFilterOptions,
  ["feed-hierarchical-filter-options"],
  { revalidate: FILTER_OPTIONS_REVALIDATE_SECONDS },
);
