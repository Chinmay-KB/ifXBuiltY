import type { GenerationJobInput } from "@/lib/generation/run-generation-job";

import {
  scheduleInlineJob,
  type DispatchGenerationResult,
} from "@/lib/generation/dispatch-inline";

export type { DispatchGenerationResult };

function shouldUseWorkflowRuntime(): boolean {
  const flag = process.env.GENERATION_USE_WORKFLOW?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  // Workflow only executes on Vercel; local `next dev` never runs the worker.
  if (process.env.VERCEL !== "1") {
    if (flag === "true" || flag === "1") {
      console.warn(
        "[generation] GENERATION_USE_WORKFLOW is ignored locally; using inline runner",
      );
    }
    return false;
  }
  return flag === "true" || flag === "1" || flag === undefined;
}

export async function dispatchGenerationJob(
  input: GenerationJobInput,
): Promise<DispatchGenerationResult> {
  if (!shouldUseWorkflowRuntime()) {
    return scheduleInlineJob(input);
  }

  try {
    const { startWorkflowJob } = await import("@/lib/generation/dispatch-workflow");
    return await startWorkflowJob(input);
  } catch (e) {
    console.error("[generation] workflow start failed, falling back to inline", e);
    return scheduleInlineJob(input);
  }
}
