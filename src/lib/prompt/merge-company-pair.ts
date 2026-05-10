import type { CompanyProfile } from "@/data/company-profiles";
import {
  getCompanyProfileById,
  listCompanyIds,
} from "@/data/company-profiles";

/** Max length for extraDetails — image models tolerate long prompts but stay bounded */
const MAX_EXTRA = 2800;

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
    const ids = await listCompanyIds();
    throw new RangeError(
      `Unknown company id(s): ${builderId}, ${targetId}. Valid: ${ids.join(", ")}`,
    );
  }
  if (builderId === targetId) {
    throw new RangeError("builder and target must differ for merged prompts");
  }

  const extraDetails = clampExtra(
    [
      formatStyleDna(builder.name, builder.styleDna),
      formatArchetype(target.name, target.archetype),
      `Blend: Recreate a plausible UI for "${target.name}" as if ${builder.name} shipped the product — match ${builder.name}'s interaction patterns, density, and tone.`,
      `On-screen branding: never show "${builder.name}" or "${target.name}" as logos, lockups, or combined wordmarks; no official marks—invented product/org titles and generic icons only.`,
    ].join("\n\n"),
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

/** Sample random distinct builder/target ids (uniform among companies). */
export async function randomDistinctPairIds(): Promise<{ builderId: string; targetId: string }> {
  const ids = await listCompanyIds();
  if (ids.length < 2) {
    throw new RangeError("Need at least two companies for pairing");
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
