import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/company-profiles", () => ({
  getCompanyProfileById: vi.fn(async (id: string) => {
    const profiles: Record<string, unknown> = {
      duolingo: {
        id: "duolingo",
        name: "Duolingo",
        styleDna: {
          tone: ["playful", "gamified"],
          colors: ["green", "white"],
          visual_traits: ["rounded cards", "streaks", "mascot energy"],
          ux_traits: ["habit loops", "gentle guilt-trip microcopy"],
          meme_exaggeration: ["passive-aggressive owl", "streak anxiety"],
          iconic_elements: ["green owl mascot", "heart lives", "streak flame"],
          behavioral_stereotypes: [],
          satirical_patterns: [],
        },
        archetype: {
          type: "language learning platform",
          sections: ["lesson tree", "leaderboard", "streak counter"],
          layout: "mobile-first card stack",
          content_style: ["bite-sized lessons", "gamified progress"],
        },
        logoPath: null,
      },
      microsoft: {
        id: "microsoft",
        name: "Microsoft",
        styleDna: {
          tone: ["enterprise-friendly", "formal"],
          colors: ["blue", "grey", "white"],
          visual_traits: ["Fluent Design", "clean grids", "subtle depth"],
          ux_traits: ["ribbon navigation", "dense settings"],
          meme_exaggeration: ["clippy returns", "update restart loops"],
          iconic_elements: ["Windows logo", "blue screen", "Office ribbon"],
          behavioral_stereotypes: [],
          satirical_patterns: [],
        },
        archetype: {
          type: "productivity suite",
          sections: ["ribbon toolbar", "document canvas", "sidebar panels"],
          layout: "desktop web with dense panels",
          content_style: ["documents", "spreadsheets", "enterprise dashboards"],
        },
        logoPath: null,
      },
      "google-maps": {
        id: "google-maps",
        name: "Google Maps",
        parentCompanyId: "google",
        profileType: "product",
        styleDna: {
          tone: ["helpful"],
          colors: ["blue"],
          visual_traits: ["map canvas"],
          ux_traits: ["bottom sheet"],
          meme_exaggeration: ["recalculating"],
          iconic_elements: ["blue dot"],
          behavioral_stereotypes: [],
          satirical_patterns: [],
        },
        archetype: {
          type: "maps",
          sections: ["map", "search"],
          layout: "mobile app",
          content_style: ["places"],
        },
        logoPath: null,
        defaultVibeTags: [],
        category: "maps",
        popularityTier: 1,
        researchStatus: "approved",
        memeStrength: 4,
      },
      linear: {
        id: "linear",
        name: "Linear",
        styleDna: {
          tone: ["minimal", "fast"],
          colors: ["graphite", "purple", "white"],
          visual_traits: ["ultra-minimal UI", "keyboard-shortcut hints", "dark mode"],
          ux_traits: ["keyboard-first", "instant transitions"],
          meme_exaggeration: ["everything is a keyboard shortcut", "speed obsession"],
          iconic_elements: ["purple gradient", "linear logo mark"],
          behavioral_stereotypes: [],
          satirical_patterns: [],
        },
        archetype: {
          type: "project management for software teams",
          sections: ["issue list", "board view", "cycle tracker"],
          layout: "desktop web sidebar + main content",
          content_style: ["issues", "cycles", "roadmaps"],
        },
        logoPath: null,
      },
    };
    const p = profiles[id];
    if (!p) return null;
    const base = {
      defaultVibeTags: [] as string[],
      category: "",
      popularityTier: 2,
      researchStatus: "approved",
      memeStrength: 3,
      parentCompanyId: null as string | null,
      profileType: "company" as const,
    };
    return { ...base, ...p };
  }),
  listCompanyIds: vi.fn(async () => ["duolingo", "linear", "microsoft"]),
  listSelectableProfileIds: vi.fn(async () => ["duolingo", "linear", "microsoft"]),
}));

import { mergeCompanyPair } from "@/lib/prompt/merge-company-pair";

describe("mergeCompanyPair", () => {
  it("merges duolingo x microsoft with distinct builder and target names", async () => {
    const m = await mergeCompanyPair("duolingo", "microsoft");
    expect(m.builderId).toBe("duolingo");
    expect(m.targetId).toBe("microsoft");
    expect(m.builder).toBe("Duolingo");
    expect(m.target).toBe("Microsoft");
    expect(m.extraDetails).toContain("Duolingo");
    expect(m.extraDetails).toContain("Microsoft");
    expect(m.extraDetails).toContain("Style DNA");
    expect(m.extraDetails).toContain("Archetype");
  });

  it("throws when builder equals target", async () => {
    await expect(mergeCompanyPair("linear", "linear")).rejects.toThrow(RangeError);
  });

  it("throws for unknown id", async () => {
    await expect(mergeCompanyPair("duolingo", "not-real")).rejects.toThrow(RangeError);
  });

  it("merges product x company with parent context", async () => {
    const m = await mergeCompanyPair("google-maps", "microsoft");
    expect(m.builder).toBe("Google Maps");
    expect(m.target).toBe("Microsoft");
    expect(m.extraDetails).toContain("google");
  });
});
