import { updateGenerationStatus } from "@/lib/generation/db";
import type { GenerationJobInput } from "@/lib/generation/run-generation-job";
import { runGenerationJob } from "@/lib/generation/run-generation-job";

export async function runGenerationJobSafe(input: GenerationJobInput): Promise<void> {
  try {
    await runGenerationJob(input);
  } catch (e) {
    console.error("[generation] inline job failed", e);
    const msg = e instanceof Error ? e.message : "Generation failed";
    await updateGenerationStatus(input.generationId, {
      status: "failed",
      errorMessage: msg,
      completedAt: new Date().toISOString(),
    });
  }
}
