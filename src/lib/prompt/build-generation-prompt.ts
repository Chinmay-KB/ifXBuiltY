type GenerationFields = {
  builder: string;
  target: string;
  extraDetails: string;
};

/**
 * Builds the image model prompt from structured generator fields.
 * Uses a 3-layer humor system:
 *   Layer 1 — Visual Recognition (colors, layout, component shapes)
 *   Layer 2 — UX Recognition (captchas, popup overload, weird navigation, forced onboarding)
 *   Layer 3 — Cultural Recognition (exact wording, fake notices, stereotypical CTAs, emotionally recognizable frustrations)
 */
export function buildGenerationPrompt(fields: GenerationFields): string {
  const builder = fields.builder.trim();
  const target = fields.target.trim();
  if (!builder || !target) {
    throw new TypeError("builder and target are required");
  }

  const lines = [
    `Parody UI screenshot: fictional software for a "${target}"-like scenario, built entirely in the style of "${builder}" (stylistic reference — not corporate endorsement).`,

    // 3-layer humor system
    `HUMOR LAYERS (all three must be present):`,
    `Layer 1 — Visual Recognition: Use "${builder}"'s exact color palette, component shapes, density, typography weight, and layout rhythm so the style is instantly recognizable.`,
    `Layer 2 — UX Recognition: Include stereotypical UX anti-patterns associated with "${builder}" — things like captchas, popup overload, weird navigation, forced onboarding flows, unnecessary confirmations, dark patterns, loading states, or permission dialogs that feel absurdly on-brand.`,
    `Layer 3 — Cultural Recognition (MOST IMPORTANT): Include exact wording, fake notices, stereotypical CTAs, and emotionally recognizable frustrations that people associate with "${builder}". The microcopy should make people say "oh god they would actually write that." Use culturally specific phrases, passive-aggressive notifications, guilt-trip copy, or corporate-speak that is immediately recognizable as something "${builder}" would do.`,

    // Extra details from company profile data
    fields.extraDetails.trim()
      ? `Company-specific direction:\n${fields.extraDetails.trim()}`
      : "",

    // Meme-worthiness directives
    `Include tiny details and microcopy that reveal the builder's personality — tooltips, placeholder text, error messages, notification badges, status bars, and fine print that reward close inspection.`,
    `Lean heavily into the stereotypical UX patterns, organizational behaviors, visual quirks, and culturally recognizable frustrations associated with "${builder}". The humor should come from believable overcommitment to "${builder}"'s product philosophy applied to "${target}"'s domain.`,

    // Branding guardrails
    `Branding guardrails (critical): Satirical fictional UI only. Do not depict official logos, trademarks, mascots, app icons, or authentic brand marks from real companies anywhere in the frame (header, nav, splash, watermark, favicon area). Do not render the real brand names above as logos, lockups, or prominent product titles in the UI chrome—invent plausible substitute names and neutral generic symbols instead. Match aesthetics through layout, density, color rhythm, typography feel, and component shapes only.`,

    // Output quality
    `High-fidelity UI mockup, realistic typography and layout; clearly fictional satire that is meme-worthy and shareable.`,
  ];

  return lines.filter(Boolean).join("\n");
}
