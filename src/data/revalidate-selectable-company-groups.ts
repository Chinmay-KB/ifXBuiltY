import { revalidateTag } from "next/cache";

import { SELECTABLE_COMPANY_GROUPS_CACHE_TAG } from "@/data/selectable-company-groups";

/** Immediate Data Cache bust after catalog create/approve (Route Handlers). */
export function revalidateSelectableCompanyGroups(): void {
  revalidateTag(SELECTABLE_COMPANY_GROUPS_CACHE_TAG, { expire: 0 });
}
