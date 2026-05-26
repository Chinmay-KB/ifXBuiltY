import type { CompanyGroup, CompanyProfile } from "@/data/company-profiles";
import { resolveProfileScreenType } from "@/lib/screen-type";

export type GeneratorProfileOption = {
  id: string;
  name: string;
  profileType: "company" | "product";
  parentCompanyId: string | null;
  category: string;
  screenType: string;
};

export type GeneratorProfileGroup = {
  companyId: string;
  companyName: string;
  options: GeneratorProfileOption[];
};

export function buildGeneratorProfileGroups(groups: CompanyGroup[]): GeneratorProfileGroup[] {
  return groups
    .map((g) => {
      const options: GeneratorProfileOption[] = [
        {
          id: g.company.id,
          name: g.company.name,
          profileType: "company",
          parentCompanyId: null,
          category: g.company.category,
          screenType: resolveProfileScreenType(g.company),
        },
        ...g.products
          .filter((p) => p.researchStatus === "approved")
          .map((p) => ({
            id: p.id,
            name: p.name,
            profileType: "product" as const,
            parentCompanyId: p.parentCompanyId,
            category: p.category,
            screenType: resolveProfileScreenType(p),
          })),
      ];
      return {
        companyId: g.company.id,
        companyName: g.company.name,
        options,
      };
    })
    .filter((g) => g.options.length > 0);
}

export function flattenGeneratorProfileGroups(
  groups: GeneratorProfileGroup[],
): GeneratorProfileOption[] {
  return groups.flatMap((g) => g.options);
}

export function profileById(
  groups: GeneratorProfileGroup[],
): Map<string, GeneratorProfileOption> {
  const map = new Map<string, GeneratorProfileOption>();
  for (const g of groups) {
    for (const opt of g.options) {
      map.set(opt.id, opt);
    }
  }
  return map;
}

export function resolveProfileIdByName(
  name: string,
  groups: GeneratorProfileGroup[],
): string | null {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return null;
  for (const g of groups) {
    for (const opt of g.options) {
      if (opt.name.toLowerCase() === trimmed) return opt.id;
    }
  }
  return null;
}

export function groupsFromProfiles(all: CompanyProfile[]): CompanyGroup[] {
  const companies = all.filter((p) => p.profileType === "company");
  const products = all.filter(
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

export type ProfileFilterBucket = "all" | "consumer" | "work" | "dev" | "finance" | "social" | "media";

export const PROFILE_FILTER_OPTIONS: { id: ProfileFilterBucket; label: string }[] = [
  { id: "all", label: "All" },
  { id: "consumer", label: "Consumer" },
  { id: "work", label: "Work" },
  { id: "dev", label: "Developer" },
  { id: "finance", label: "Finance" },
  { id: "social", label: "Social" },
  { id: "media", label: "Media" },
];

const BUCKET_CATEGORIES: Record<Exclude<ProfileFilterBucket, "all">, string[]> = {
  consumer: ["search", "maps", "commerce", "shopping", "OS", "mobile app"],
  work: ["docs", "productivity", "IDE", "collaboration"],
  dev: ["IDE", "developer tools", "devtools", "cloud", "database"],
  finance: ["payments", "banking", "trading", "crypto"],
  social: ["social", "messaging", "dating"],
  media: ["video", "music", "streaming", "media"],
};

export function bucketForCategory(category: string): ProfileFilterBucket | null {
  const c = category.toLowerCase();
  for (const [bucket, cats] of Object.entries(BUCKET_CATEGORIES) as [Exclude<ProfileFilterBucket, "all">, string[]][]) {
    if (cats.some((x) => c.includes(x.toLowerCase()))) return bucket;
  }
  return null;
}

export function filterProfileGroups(
  groups: GeneratorProfileGroup[],
  opts: { search?: string; bucket?: ProfileFilterBucket },
): GeneratorProfileGroup[] {
  const q = opts.search?.trim().toLowerCase() ?? "";
  const bucket = opts.bucket ?? "all";

  return groups
    .map((g) => {
      const options = g.options.filter((opt) => {
        if (bucket !== "all") {
          const b = bucketForCategory(opt.category);
          if (b !== bucket && !(opt.profileType === "company" && bucket === "consumer")) {
            return false;
          }
        }
        if (!q) return true;
        return (
          opt.name.toLowerCase().includes(q) ||
          opt.id.toLowerCase().includes(q) ||
          g.companyName.toLowerCase().includes(q)
        );
      });
      return { ...g, options };
    })
    .filter((g) => g.options.length > 0);
}
