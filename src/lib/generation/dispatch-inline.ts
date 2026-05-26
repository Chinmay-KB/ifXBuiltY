import { after } from "next/server";

import type { GenerationJobInput } from "@/lib/generation/run-generation-job";
import { runGenerationJobSafe } from "@/lib/generation/generation-job-runner";

export type DispatchGenerationResult = {
  runId: string;
  mode: "workflow" | "inline";
};

export function scheduleInlineJob(input: GenerationJobInput): DispatchGenerationResult {
  const runId = `inline-${input.generationId}`;

  if (process.env.VERCEL === "1") {
    after(() => runGenerationJobSafe(input));
  } else {
    // `after()` is unreliable in local `next dev`; run immediately in-process.
    void runGenerationJobSafe(input);
  }

  return { runId, mode: "inline" };
}
