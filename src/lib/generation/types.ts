export const GENERATION_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export function isGenerationStatus(v: string): v is GenerationStatus {
  return (GENERATION_STATUSES as readonly string[]).includes(v);
}

export function isGenerationInProgress(status: GenerationStatus): boolean {
  return status === "queued" || status === "processing";
}

export type GenerationJobPayload = {
  generationId: number;
  userId: string;
  dodoCustomerId: string;
  bucket: string;
  slug: string;
  ext: string;
  objectPath: string;
  prompt: string;
  promptInput: string | { images: Buffer[]; text: string };
  imageModel: string;
  entitlementId: string;
};
