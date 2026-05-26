import { start } from "workflow/api";

import type { GenerationJobInput } from "@/lib/generation/run-generation-job";
import { generateImageWorkflow } from "../../../workflows/generate-image";

import type { DispatchGenerationResult } from "@/lib/generation/dispatch-inline";

export async function startWorkflowJob(
  input: GenerationJobInput,
): Promise<DispatchGenerationResult> {
  const run = await start(generateImageWorkflow, [input]);
  return { runId: run.runId, mode: "workflow" };
}
