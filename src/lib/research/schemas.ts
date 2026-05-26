import { z } from "zod";

export const productResearchAgentInputSchema = z.object({
  seedCompanyName: z.string().trim().optional(),
  seedCategory: z.string().trim().optional(),
  maxProducts: z.number().int().min(1).max(50).default(5),
  region: z.string().trim().optional(),
  runMode: z.enum(["discover", "single"]).default("discover"),
});

export type ProductResearchAgentInput = z.infer<typeof productResearchAgentInputSchema>;

const styleDnaSchema = z.object({
  tone: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  visual_traits: z.array(z.string()).default([]),
  ux_traits: z.array(z.string()).default([]),
  meme_exaggeration: z.array(z.string()).default([]),
  iconic_elements: z.array(z.string()).default([]),
  behavioral_stereotypes: z.array(z.string()).default([]),
  satirical_patterns: z.array(z.string()).default([]),
});

const archetypeSchema = z.object({
  type: z.string().default(""),
  sections: z.array(z.string()).default([]),
  layout: z.string().default(""),
  content_style: z.array(z.string()).default([]),
});

export const discoveredProductCandidateSchema = z.object({
  productSlug: z.string().min(1),
  name: z.string().min(1),
  parentCompanyId: z.string().nullable().optional(),
  category: z.string().default(""),
  screenTypeGuess: z.string().default(""),
  officialUrl: z.string().url().optional(),
  popularityScore: z.number().min(0).max(5).optional(),
  memeScore: z.number().min(0).max(5).optional(),
  citations: z.array(z.string().url()).default([]),
});

export const researchedProductProfileSchema = z.object({
  productSlug: z.string().min(1),
  name: z.string().min(1),
  parentCompanyId: z.string().nullable().optional(),
  category: z.string().default(""),
  screenType: z.string().min(1),
  popularityTier: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  memeStrength: z.number().int().min(1).max(5).default(3),
  styleDna: styleDnaSchema,
  archetype: archetypeSchema,
  defaultVibeTags: z.array(z.string()).default([]),
  sourceUrls: z.array(z.string().url()).min(1),
});

export const memeDnaSchema = z.object({
  observedMemes: z.array(z.string()).default([]),
  userFrustrations: z.array(z.string()).default([]),
  culturalShorthand: z.string().default(""),
  inferenceNotes: z.array(z.string()).default([]),
});

export const screenshotCandidateSchema = z.object({
  sourceUrl: z.string().url(),
  viewport: z.string().optional(),
  notes: z.string().optional(),
});

export const productResearchAgentOutputSchema = z.object({
  runId: z.string().uuid(),
  candidates: z.array(discoveredProductCandidateSchema),
  rejected: z.array(
    z.object({
      productSlug: z.string(),
      reason: z.string(),
    }),
  ),
  drafts: z.array(
    z.object({
      profile: researchedProductProfileSchema,
      memeDna: memeDnaSchema.optional(),
      screenshots: z.array(screenshotCandidateSchema).default([]),
    }),
  ),
});

export type ProductResearchAgentOutput = z.infer<typeof productResearchAgentOutputSchema>;

export function validateDraftForReview(draft: {
  profile: z.infer<typeof researchedProductProfileSchema>;
  memeDna?: z.infer<typeof memeDnaSchema>;
}): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const p = draft.profile;
  if (p.sourceUrls.length === 0) errors.push("missing source URLs");
  if (!p.screenType.trim()) errors.push("missing screen type");
  if (p.styleDna.meme_exaggeration.length === 0 && !draft.memeDna) {
    errors.push("missing meme DNA");
  }
  if (!p.archetype.type && p.archetype.sections.length === 0) {
    errors.push("missing archetype");
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
