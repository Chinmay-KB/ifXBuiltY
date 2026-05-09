import raw from "./company-profiles.json";

export type CompanyProfile = {
  id: string;
  name: string;
  tone: string;
  screenType: string;
  region: string;
  /** When this company is the builder — visual language */
  builderStyle: string;
  /** When this company is the target — domain/product vibe */
  targetDomain: string;
  /** Short category label for prompt blending */
  productCategory: string;
};

export const COMPANY_PROFILES: CompanyProfile[] = raw as CompanyProfile[];

const byId = new Map(COMPANY_PROFILES.map((c) => [c.id, c]));

export function getCompanyProfileById(id: string): CompanyProfile | undefined {
  return byId.get(id);
}

export function listCompanyIds(): string[] {
  return COMPANY_PROFILES.map((c) => c.id);
}
