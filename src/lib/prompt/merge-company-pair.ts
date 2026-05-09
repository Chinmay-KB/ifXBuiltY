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
  tone: string;
  screenType: string;
  region: string;
  extraDetails: string;
};

function clampExtra(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_EXTRA) return t;
  return `${t.slice(0, MAX_EXTRA - 1)}…`;
}

/**
 * Merge two company profiles into API fields for {@link buildGenerationPrompt}.
 * Builder supplies tone/screen/region defaults; both contribute extraDetails.
 */
export function mergeCompanyPair(
  builderId: string,
  targetId: string,
): MergedGenerationFields {
  const builder = getCompanyProfileById(builderId);
  const target = getCompanyProfileById(targetId);
  if (!builder || !target) {
    throw new RangeError(
      `Unknown company id(s): ${builderId}, ${targetId}. Valid: ${listCompanyIds().join(", ")}`,
    );
  }
  if (builderId === targetId) {
    throw new RangeError("builder and target must differ for merged prompts");
  }

  const extraDetails = clampExtra(
    [
      `Builder look-and-feel (${builder.name}): ${builder.builderStyle}`,
      `Target scenario (${target.name} — ${target.productCategory}): ${target.targetDomain}`,
      `Blend: Recreate a plausible UI for "${target.name}"-style ${target.productCategory} as if ${builder.name} shipped the product — match ${builder.name}'s interaction patterns, density, and tone.`,
      `On-screen branding: never show "${builder.name}" or "${target.name}" as logos, lockups, or combined wordmarks; no official marks—invented product/org titles and generic icons only.`,
    ].join("\n\n"),
  );

  return {
    builder: builder.name,
    target: target.name,
    tone: builder.tone,
    screenType: builder.screenType,
    region: builder.region,
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
export function fillFourUniqueSlots(): SlotWithFields[] {
  const used = new Set<string>();
  const out: SlotWithFields[] = [];
  let attempts = 0;
  while (out.length < 4 && attempts < 400) {
    attempts++;
    const { builderId, targetId } = randomDistinctPairIds();
    const key = profilePairKey(builderId, targetId);
    if (used.has(key)) continue;
    used.add(key);
    out.push({
      builderId,
      targetId,
      fields: mergeCompanyPair(builderId, targetId),
    });
  }
  if (out.length < 4) {
    throw new Error("Could not sample 4 unique company pairs");
  }
  return out;
}

/** Sample random distinct builder/target ids (uniform among companies). */
export function randomDistinctPairIds(): { builderId: string; targetId: string } {
  const ids = listCompanyIds();
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
export function mergeCompanyProfiles(
  builder: CompanyProfile,
  target: CompanyProfile,
): MergedGenerationFields {
  if (builder.id === target.id) {
    throw new RangeError("builder and target must differ");
  }
  return mergeCompanyPair(builder.id, target.id);
}
