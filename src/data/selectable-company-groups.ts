import type { CompanyGroup, CompanyProfile } from "@/data/company-profiles";

/** Shared Data Cache tag for the generator picker and feed catalog filters. */
export const SELECTABLE_COMPANY_GROUPS_CACHE_TAG = "selectable-company-groups";

/**
 * Group companies (always) with approved products only.
 * Used by the generator picker and any in-memory catalog grouping.
 */
export function groupSelectableCompanyProfiles(
  profiles: CompanyProfile[],
): CompanyGroup[] {
  const companies = profiles.filter((p) => p.profileType === "company");
  const products = profiles.filter(
    (p) => p.profileType === "product" && p.researchStatus === "approved",
  );

  return companies
    .map((company) => ({
      company,
      products: products
        .filter((p) => p.parentCompanyId === company.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.company.name.localeCompare(b.company.name));
}
