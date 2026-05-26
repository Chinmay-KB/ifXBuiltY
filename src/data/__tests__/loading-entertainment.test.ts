import { describe, expect, it } from "vitest";

import companyProfiles from "@/data/company-profiles.json";
import { getAllFunFacts } from "@/data/loading-entertainment";

type CatalogProduct = { id: string; name: string };
type CatalogCompany = { id: string; name: string; products?: CatalogProduct[] };

function normalize(text: string): string {
  return text.toLowerCase();
}

function hasNameMention(facts: string[], name: string): boolean {
  const lowerName = normalize(name);
  return facts.some((fact) => normalize(fact).includes(lowerName));
}

describe("loading entertainment facts coverage", () => {
  it("provides named fun facts for all catalog companies and products", () => {
    for (const company of companyProfiles as CatalogCompany[]) {
      const companyFacts = getAllFunFacts(company.name, company.id);
      expect(companyFacts.length).toBeGreaterThanOrEqual(3);
      expect(hasNameMention(companyFacts, company.name)).toBe(true);

      for (const product of company.products ?? []) {
        const productFacts = getAllFunFacts(product.name, product.id);
        expect(productFacts.length).toBeGreaterThanOrEqual(3);
        expect(hasNameMention(productFacts, product.name)).toBe(true);
      }
    }
  });
});
