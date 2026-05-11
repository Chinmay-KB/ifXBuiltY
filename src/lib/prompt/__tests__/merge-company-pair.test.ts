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
    return profiles[id] ?? null;
  }),
  listCompanyIds: vi.fn(async () => ["duolingo", "linear", "microsoft"]),
}));

import { mergeCompanyPair } from "@/lib/prompt/merge-company-pair";

describe("mergeCompanyPair", () => {
  it("merges duolingo x microsoft with distinct builder and target names", async () => {
    const m = await mergeCompanyPair("duolingo", "microsoft");
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
});
