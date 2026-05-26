import type { GeneratorProfileGroup, GeneratorProfileOption } from "@/data/generator-profile-options";

export function companyNameForOption(
  groups: GeneratorProfileGroup[],
  opt: GeneratorProfileOption,
): string {
  if (opt.profileType === "company") return opt.name;
  const parentId = opt.parentCompanyId;
  if (parentId) {
    const g = groups.find((x) => x.companyId === parentId);
    if (g) return g.companyName;
  }
  for (const g of groups) {
    if (g.options.some((o) => o.id === opt.id)) return g.companyName;
  }
  return opt.name;
}

export function productCountForGroup(group: GeneratorProfileGroup): number {
  return group.options.filter((o) => o.profileType === "product").length || group.options.length;
}

export function pickerTitle(field: "builder" | "target"): {
  label: string;
  headline: string;
} {
  if (field === "builder") {
    return { label: "Choose the builder", headline: "If … built Y" };
  }
  return { label: "Choose the target", headline: "If X built …" };
}
