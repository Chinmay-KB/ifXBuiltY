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
    `Parody UI screenshot: a plausible fake product screen for "${target}" as if built by "${builder}".`,
    fields.tone.trim() ? `Tone: ${fields.tone.trim()}.` : "",
    fields.screenType.trim() ? `Screen type: ${fields.screenType.trim()}.` : "",
    fields.region.trim() ? `Regional/cultural cues: ${fields.region.trim()}.` : "",
    fields.extraDetails.trim()
      ? `Additional direction: ${fields.extraDetails.trim()}.`
      : "",
    "High-fidelity UI mockup, realistic typography and layout; clearly fictional satire.",
  ];

  return lines.filter(Boolean).join("\n");
}
