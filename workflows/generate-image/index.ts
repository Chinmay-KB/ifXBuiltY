import type { GenerationJobInput } from "@/lib/generation/run-generation-job";
import { runGenerationJob } from "@/lib/generation/run-generation-job";

export type GenerateImageWorkflowInput = GenerationJobInput;

export async function generateImageWorkflow(
  input: GenerateImageWorkflowInput,
): Promise<{ generationId: number; status: "completed" | "failed" }> {
  "use workflow";

  return runGenerationJobStep(input);
}

async function runGenerationJobStep(
  input: GenerateImageWorkflowInput,
): Promise<{ generationId: number; status: "completed" | "failed" }> {
  "use step";
  return runGenerationJob(input);
}
