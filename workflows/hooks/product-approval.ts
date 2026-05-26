import { defineHook } from "workflow";
import { z } from "zod";

export const productApprovalHook = defineHook({
  schema: z.object({
    approved: z.boolean(),
    comment: z.string().optional(),
    edits: z
      .object({
        style_dna: z.record(z.string(), z.array(z.string())).optional(),
        archetype: z.record(z.string(), z.unknown()).optional(),
        meme_dna: z.record(z.string(), z.unknown()).optional(),
      })
      .optional(),
  }),
});
