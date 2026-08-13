import { describe, expect, it } from "vitest";

import {
  flattenGeneratorProfileGroups,
  resolveProfileLookup,
  AmbiguousProfileError,
  UnknownProfileError,
} from "@/data/generator-profile-options";
import { mockGeneratorProfileGroups } from "@/data/test-fixtures/profile-groups";
import {
  assembleMashupPrompt,
  assertMashupArgs,
  combineUserExtraDetails,
  mashupListingFields,
  MASHUP_HELP,
  parseMashupArgs,
} from "@/lib/ops/mashup-cli";

describe("parseMashupArgs", () => {
  it("parses builder, target, extras, invented name, and screen type", () => {
    const args = parseMashupArgs(
      [
        "--builder",
        "ikea",
        "--target",
        "figma",
        "--invented-name",
        "SKISSA",
        "--extra-details",
        'Empty Figma canvas. "Some assembly required."',
        "--screen-type",
        "desktop",
      ],
      {},
    );
    expect(args.builder).toBe("ikea");
    expect(args.target).toBe("figma");
    expect(args.inventedName).toBe("SKISSA");
    expect(args.extraDetails).toContain("Some assembly required");
    expect(args.screenType).toBe("desktop");
    expect(args.dryRun).toBe(false);
    expect(args.publish).toBe(false);
    expect(args.help).toBe(false);
  });

  it("parses short flags and --dry-run", () => {
    const args = parseMashupArgs(
      [
        "-b",
        "apple-ios",
        "-t",
        "tinder",
        "-e",
        "Tinder deck plus a Personality slider.",
        "--name",
        "Halo",
        "--screen",
        "mobile",
        "--dry-run",
      ],
      {},
    );
    expect(args.builder).toBe("apple-ios");
    expect(args.target).toBe("tinder");
    expect(args.inventedName).toBe("Halo");
    expect(args.screenType).toBe("mobile");
    expect(args.dryRun).toBe(true);
    expect(args.publish).toBe(false);
  });

  it("parses --publish without changing --dry-run", () => {
    const args = parseMashupArgs(
      ["--builder", "ikea", "--target", "figma", "--publish"],
      {},
    );
    expect(args.publish).toBe(true);
    expect(args.dryRun).toBe(false);
  });

  it("honors DRY_RUN=1 without hitting the gateway path", () => {
    const args = parseMashupArgs(["--builder", "ikea", "--target", "figma"], {
      DRY_RUN: "1",
    });
    expect(args.dryRun).toBe(true);
  });

  it("parses --flag=value forms used by the four pairings", () => {
    const ikea = parseMashupArgs(
      ["--builder=ikea", "--target=figma", "--invented-name=SKISSA"],
      {},
    );
    expect(ikea.builder).toBe("ikea");
    expect(ikea.target).toBe("figma");
    expect(ikea.inventedName).toBe("SKISSA");

    const duolingo = parseMashupArgs(
      [
        "--builder=duolingo",
        "--target=apple-ios",
        "--invented-name=Perch",
        "--extra-details=Lock screen. Streak dying.",
      ],
      {},
    );
    expect(duolingo.builder).toBe("duolingo");
    expect(duolingo.target).toBe("apple-ios");

    const google = parseMashupArgs(
      ["--builder=google", "--target=google-gmail", "--invented-name=Burst"],
      {},
    );
    expect(google.builder).toBe("google");
    expect(google.target).toBe("google-gmail");
  });

  it("treats --help as documentation, not a generate", () => {
    const args = parseMashupArgs(["--help"]);
    expect(args.help).toBe(true);
    assertMashupArgs(args);
  });

  it("requires builder and target unless --help", () => {
    expect(() => assertMashupArgs(parseMashupArgs(["--dry-run"]))).toThrow(
      /--builder and --target/,
    );
  });

  it("rejects unknown flags", () => {
    expect(() => parseMashupArgs(["--midjourney"])).toThrow(/Unknown flag/);
  });
});

describe("mashupListingFields", () => {
  it("defaults to draft so the row is not publicly listed", () => {
    expect(mashupListingFields(false)).toEqual({
      visibility: "draft",
      moderation_status: "visible",
    });
  });

  it("maps --publish to published + visible", () => {
    expect(mashupListingFields(true)).toEqual({
      visibility: "published",
      moderation_status: "visible",
    });
  });
});

describe("MASHUP_HELP", () => {
  it("documents flags and the four example pairings", () => {
    expect(MASHUP_HELP).toContain("--builder");
    expect(MASHUP_HELP).toContain("--target");
    expect(MASHUP_HELP).toContain("--dry-run");
    expect(MASHUP_HELP).toContain("--publish");
    expect(MASHUP_HELP).toContain("SKISSA");
    expect(MASHUP_HELP).toContain("Halo");
    expect(MASHUP_HELP).toContain("Perch");
    expect(MASHUP_HELP).toContain("Burst");
    expect(MASHUP_HELP).toContain("ikea");
    expect(MASHUP_HELP).toContain("apple-ios");
    expect(MASHUP_HELP).toContain("tinder");
    expect(MASHUP_HELP).toContain("duolingo");
    expect(MASHUP_HELP).toContain("google-gmail");
  });
});

describe("resolveProfileLookup", () => {
  const profiles = flattenGeneratorProfileGroups(mockGeneratorProfileGroups()).map(
    (p) => ({ id: p.id, name: p.name }),
  );

  it("resolves slug before name", () => {
    expect(resolveProfileLookup("ikea", profiles)).toEqual({
      id: "ikea",
      name: "IKEA",
    });
    expect(resolveProfileLookup("google-youtube", profiles).id).toBe(
      "google-youtube",
    );
  });

  it("resolves exact name case-insensitively", () => {
    expect(resolveProfileLookup("YouTube", profiles).id).toBe("google-youtube");
  });

  it("fails clearly when a name is ambiguous", () => {
    const withDupes = [
      ...profiles,
      { id: "ios-lock", name: "iOS" },
      { id: "apple-ios", name: "iOS" },
    ];
    expect(() => resolveProfileLookup("iOS", withDupes)).toThrow(
      AmbiguousProfileError,
    );
    expect(() => resolveProfileLookup("iOS", withDupes)).toThrow(/apple-ios/);
    expect(() => resolveProfileLookup("iOS", withDupes)).toThrow(/ios-lock/);
  });

  it("fails clearly when nothing matches", () => {
    expect(() => resolveProfileLookup("midjourney", profiles)).toThrow(
      UnknownProfileError,
    );
  });
});

describe("dry-run prompt assembly", () => {
  it("includes style merge extras, invented name, and user notes in the built prompt", () => {
    const prompt = assembleMashupPrompt({
      builder: "IKEA",
      target: "Figma",
      mergedExtraDetails: "Style DNA (IKEA): Tone: instruction-manual.",
      extraDetails:
        'Empty Figma canvas. Microcopy: "Some assembly required." The move tool is an Allen key.',
      inventedName: "SKISSA",
      screenType: "desktop",
    });
    expect(prompt).toContain("IKEA");
    expect(prompt).toContain("Figma");
    expect(prompt).toContain("Style DNA (IKEA)");
    expect(prompt).toContain("SKISSA");
    expect(prompt).toContain("Some assembly required");
    expect(prompt).toContain("Allen key");
    expect(prompt).toContain("16:9");
    expect(prompt).toContain("Additional notes from user");
  });

  it("does not invent a second prompt path when extras are empty", () => {
    const merged = "Style DNA (Google): Colors: blue.";
    expect(combineUserExtraDetails(merged, { extraDetails: "", inventedName: "" })).toBe(
      merged,
    );
  });
});
