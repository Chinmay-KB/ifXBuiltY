import type { CompanyGroup } from "@/data/company-profiles";
import {
  buildGeneratorProfileGroups,
  type GeneratorProfileGroup,
} from "@/data/generator-profile-options";

/** Minimal company/product groups for unit tests (no JSON catalog). */
export function mockCompanyGroups(): CompanyGroup[] {
  const duolingo = {
    id: "duolingo",
    name: "Duolingo",
    styleDna: {
      tone: [],
      colors: [],
      visual_traits: [],
      ux_traits: [],
      meme_exaggeration: [],
      iconic_elements: [],
      behavioral_stereotypes: [],
      satirical_patterns: [],
    },
    archetype: {
      type: "",
      sections: [],
      layout: "mobile app",
      content_style: [],
    },
    logoPath: null,
    defaultVibeTags: [],
    parentCompanyId: null,
    profileType: "company" as const,
    category: "mobile app",
    popularityTier: 1,
    researchStatus: "approved",
    memeStrength: 3,
  };

  const ikea = {
    ...duolingo,
    id: "ikea",
    name: "IKEA",
    archetype: { ...duolingo.archetype, layout: "desktop web" },
    category: "commerce",
  };

  const google = {
    ...duolingo,
    id: "google",
    name: "Google",
    category: "search",
  };

  const youtube = {
    ...duolingo,
    id: "google-youtube",
    name: "YouTube",
    parentCompanyId: "google",
    profileType: "product" as const,
    category: "video",
  };

  return [
    { company: duolingo, products: [] },
    { company: ikea, products: [] },
    { company: google, products: [youtube] },
  ];
}

export function mockGeneratorProfileGroups(): GeneratorProfileGroup[] {
  return buildGeneratorProfileGroups(mockCompanyGroups());
}
