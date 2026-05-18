import type { CompanyProfile } from "@/data/company-profiles";
import {
  getCompanyProfileById,
  listSelectableProfileIds,
} from "@/data/company-profiles";

/** Max length for extraDetails — image models tolerate long prompts but stay bounded */
const MAX_EXTRA = 4000;

export type MergedGenerationFields = {
  builder: string;
  target: string;
  extraDetails: string;
};

function clampExtra(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_EXTRA) return t;
  return `${t.slice(0, MAX_EXTRA - 1)}…`;
}

/**
 * Serialize a company's style DNA into a readable prompt fragment.
 */
function formatStyleDna(name: string, dna: CompanyProfile["styleDna"]): string {
  const parts: string[] = [];
  if (dna.tone.length > 0) parts.push(`Tone: ${dna.tone.join(", ")}`);
  if (dna.colors.length > 0) parts.push(`Colors: ${dna.colors.join(", ")}`);
  if (dna.visual_traits.length > 0) parts.push(`Visual traits: ${dna.visual_traits.join(", ")}`);
  if (dna.ux_traits.length > 0) parts.push(`UX traits: ${dna.ux_traits.join(", ")}`);
  if (dna.meme_exaggeration.length > 0) parts.push(`Meme exaggeration: ${dna.meme_exaggeration.join(", ")}`);
  if (dna.iconic_elements.length > 0) parts.push(`Iconic elements: ${dna.iconic_elements.join(", ")}`);
  if (dna.behavioral_stereotypes.length > 0) parts.push(`Behavioral stereotypes: ${dna.behavioral_stereotypes.join(", ")}`);
  if (dna.satirical_patterns.length > 0) parts.push(`Satirical patterns: ${dna.satirical_patterns.join(", ")}`);
  return `Style DNA (${name}): ${parts.join(". ")}`;
}

/**
 * Serialize a company's archetype into a readable prompt fragment.
 */
function formatArchetype(name: string, arch: CompanyProfile["archetype"]): string {
  const parts: string[] = [];
  if (arch.type) parts.push(`Type: ${arch.type}`);
  if (arch.layout) parts.push(`Layout: ${arch.layout}`);
  if (arch.sections.length > 0) parts.push(`Sections: ${arch.sections.join(", ")}`);
  if (arch.content_style.length > 0) parts.push(`Content style: ${arch.content_style.join(", ")}`);
  return `Archetype (${name}): ${parts.join(". ")}`;
}

/**
 * Merge two company profiles into API fields for prompt building.
 * Builder supplies style DNA; target supplies archetype.
 */
export async function mergeCompanyPair(
  builderId: string,
  targetId: string,
): Promise<MergedGenerationFields> {
  const builder = await getCompanyProfileById(builderId);
  const target = await getCompanyProfileById(targetId);
  if (!builder || !target) {
    const ids = await listSelectableProfileIds();
    throw new RangeError(
      `Unknown profile id(s): ${builderId}, ${targetId}. Valid: ${ids.join(", ")}`,
    );
  }
  if (builderId === targetId) {
    throw new RangeError("builder and target must differ for merged prompts");
  }

  const extraDetails = clampExtra(
    [
      // Layer 1: Visual Recognition
      formatStyleDna(builder.name, builder.styleDna),
      formatArchetype(target.name, target.archetype),

      // Parent company context for products
      builder.parentCompanyId
        ? `Note: ${builder.name} is a product of ${builder.parentCompanyId} — use the product's specific style, not the parent company's branding.`
        : "",
      target.parentCompanyId
        ? `Note: ${target.name} is a product of ${target.parentCompanyId} — the target domain is this specific product, not the parent company.`
        : "",

      // Layer 2: UX Recognition
      builder.styleDna.ux_traits.length > 0
        ? `UX Anti-Patterns to exaggerate (${builder.name}): ${builder.styleDna.ux_traits.join(", ")}. Push these to absurd extremes — captchas where they don't belong, popup overload, forced onboarding for trivial actions, weird navigation that only ${builder.name} would think is intuitive.`
        : "",

      // Layer 2 bonus: satirical patterns
      builder.styleDna.satirical_patterns.length > 0
        ? `Satirical UX Patterns (${builder.name}): ${builder.styleDna.satirical_patterns.join("; ")}.`
        : "",

      // Layer 3: Cultural Recognition (MOST IMPORTANT)
      builder.styleDna.meme_exaggeration.length > 0
        ? `Cultural Meme Triggers (${builder.name}) — THIS IS THE MOST IMPORTANT LAYER: ${builder.styleDna.meme_exaggeration.join("; ")}. Use exact phrasing, fake notices, stereotypical CTAs, and emotionally recognizable frustrations that people instantly associate with ${builder.name}. The microcopy must make people say "they would actually do this."`
        : "",

      // Layer 3 bonus: behavioral stereotypes
      builder.styleDna.behavioral_stereotypes.length > 0
        ? `Behavioral Stereotypes (${builder.name}): ${builder.styleDna.behavioral_stereotypes.join("; ")}. Lean into these organizational behaviors — the humor comes from believable overcommitment to ${builder.name}'s product philosophy.`
        : "",

      `Blend: Recreate a plausible UI for "${target.name}" as if ${builder.name} shipped the product — match ${builder.name}'s interaction patterns, density, and tone, but applied to ${target.name}'s domain in a way that is immediately funny and shareable.`,
      `On-screen branding: never show "${builder.name}" or "${target.name}" as logos, lockups, or combined wordmarks; no official marks—invented product/org titles and generic icons only.`,
    ].filter(Boolean).join("\n\n"),
  );

  return {
    builder: builder.name,
    target: target.name,
    extraDetails,
  };
}

export function profilePairKey(builderId: string, targetId: string): string {
  return `${builderId}__${targetId}`;
}

export type SlotWithFields = {
  builderId: string;
  targetId: string;
  fields: MergedGenerationFields;
};

/** Four random builder/target pairs with no duplicate pair in the batch */
export async function fillFourUniqueSlots(): Promise<SlotWithFields[]> {
  const used = new Set<string>();
  const out: SlotWithFields[] = [];
  let attempts = 0;
  while (out.length < 4 && attempts < 400) {
    attempts++;
    const { builderId, targetId } = await randomDistinctPairIds();
    const key = profilePairKey(builderId, targetId);
    if (used.has(key)) continue;
    used.add(key);
    out.push({
      builderId,
      targetId,
      fields: await mergeCompanyPair(builderId, targetId),
    });
  }
  if (out.length < 4) {
    throw new Error("Could not sample 4 unique company pairs");
  }
  return out;
}

/** Sample random distinct builder/target ids (uniform among companies and products). */
export async function randomDistinctPairIds(): Promise<{ builderId: string; targetId: string }> {
  const ids = await listSelectableProfileIds();
  if (ids.length < 2) {
    throw new RangeError("Need at least two profiles for pairing");
  }
  let builderId = ids[Math.floor(Math.random() * ids.length)]!;
  let targetId = ids[Math.floor(Math.random() * ids.length)]!;
  let guard = 0;
  while (builderId === targetId && guard++ < 50) {
    targetId = ids[Math.floor(Math.random() * ids.length)]!;
  }
  if (builderId === targetId) {
    builderId = ids[0]!;
    targetId = ids[1]!;
  }
  return { builderId, targetId };
}

/** For testing / advanced UI: merge from full profiles without id lookup */
export async function mergeCompanyProfiles(
  builder: CompanyProfile,
  target: CompanyProfile,
): Promise<MergedGenerationFields> {
  if (builder.id === target.id) {
    throw new RangeError("builder and target must differ");
  }
  return mergeCompanyPair(builder.id, target.id);
}
