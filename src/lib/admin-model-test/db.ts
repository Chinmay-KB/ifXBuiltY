import type { AdminModelTestRunStatus, AdminModelTestRunPublishState } from "@/lib/admin-model-test/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function updateAdminModelTestRun(
  runId: string,
  patch: {
    status?: AdminModelTestRunStatus;
    errorMessage?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    durationMs?: number | null;
    imagePath?: string | null;
    imageReady?: boolean;
    publishState?: AdminModelTestRunPublishState;
    publishedGenerationId?: number | null;
  },
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("admin_model_test_runs")
    .update({
      status: patch.status ?? undefined,
      error_message: patch.errorMessage ?? undefined,
      started_at: patch.startedAt ?? undefined,
      completed_at: patch.completedAt ?? undefined,
      duration_ms: patch.durationMs ?? undefined,
      image_path: patch.imagePath ?? undefined,
      image_ready: patch.imageReady ?? undefined,
      publish_state: patch.publishState ?? undefined,
      published_generation_id: patch.publishedGenerationId ?? undefined,
    })
    .eq("id", runId);

  if (error) {
    throw new Error(`Failed to update admin_model_test_runs ${runId}: ${error.message}`);
  }
}

