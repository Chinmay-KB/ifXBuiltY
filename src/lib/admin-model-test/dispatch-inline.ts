import { after } from "next/server";

import type { AdminModelTestRunJobInput } from "@/lib/admin-model-test/run-admin-model-test-run";
import { runAdminModelTestRunSafe } from "@/lib/admin-model-test/admin-model-test-job-runner";

export type DispatchAdminModelTestRunResult = {
  runId: string;
  mode: "inline";
};

export function scheduleAdminModelTestRunInlineJob(
  input: AdminModelTestRunJobInput,
): DispatchAdminModelTestRunResult {
  const runId = `inline-admin-model-test-${input.runId}`;

  if (process.env.VERCEL === "1") {
    after(() => runAdminModelTestRunSafe(input));
  } else {
    void runAdminModelTestRunSafe(input);
  }

  return { runId, mode: "inline" };
}

