import type { AdminModelTestRunJobInput } from "@/lib/admin-model-test/run-admin-model-test-run";
import { runAdminModelTestRun } from "@/lib/admin-model-test/run-admin-model-test-run";
import { updateAdminModelTestRun } from "@/lib/admin-model-test/db";

export async function runAdminModelTestRunSafe(
  input: AdminModelTestRunJobInput,
): Promise<void> {
  try {
    await runAdminModelTestRun(input);
  } catch (e) {
    // This should rarely happen since runAdminModelTestRun catches and updates,
    // but keep the safety net consistent with generation jobs.
    const msg = e instanceof Error ? e.message : "Model test run failed";
    await updateAdminModelTestRun(input.runId, {
      status: "failed",
      errorMessage: msg,
      completedAt: new Date().toISOString(),
    });
  }
}

