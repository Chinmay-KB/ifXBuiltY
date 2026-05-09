type GenerationFields = {
  builder: string;
  target: string;
  tone: string;
  screenType: string;
  region: string;
  extraDetails: string;
};

/**
 * Builds the image model prompt from structured generator fields.
 */
export function buildGenerationPrompt(fields: GenerationFields): string {
  const builder = fields.builder.trim();
  const target = fields.target.trim();
  if (!builder || !target) {
    throw new TypeError("builder and target are required");
  }

  const lines = [
    `Parody UI screenshot: fictional software for a "${target}"-like scenario, using only the interaction patterns and visual language commonly associated with "${builder}" (stylistic reference — not corporate endorsement).`,
    fields.tone.trim() ? `Tone: ${fields.tone.trim()}.` : "",
    fields.screenType.trim() ? `Screen type: ${fields.screenType.trim()}.` : "",
    fields.region.trim() ? `Regional/cultural cues: ${fields.region.trim()}.` : "",
    fields.extraDetails.trim()
      ? `Additional direction: ${fields.extraDetails.trim()}.`
      : "",
    "Branding guardrails (critical): Satirical fictional UI only. Do not depict official logos, trademarks, mascots, app icons, or authentic brand marks from real companies anywhere in the frame (header, nav, splash, watermark, favicon area). Do not render the real brand names above as logos, lockups, or prominent product titles in the UI chrome—invent plausible substitute names and neutral generic symbols instead. Match aesthetics through layout, density, color rhythm, typography feel, and component shapes only.",
    "High-fidelity UI mockup, realistic typography and layout; clearly fictional satire.",
  ];

  return lines.filter(Boolean).join("\n");
}
