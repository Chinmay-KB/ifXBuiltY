import type { GenerationStatus } from "@/lib/generation/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function updateGenerationStatus(
  generationId: number,
  patch: {
    status: GenerationStatus;
    errorMessage?: string | null;
    imagePath?: string | null;
    imageReady?: boolean;
    workflowRunId?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  },
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("generations")
    .update({
      status: patch.status,
      error_message: patch.errorMessage ?? undefined,
      image_path: patch.imagePath ?? undefined,
      image_ready: patch.imageReady ?? undefined,
      workflow_run_id: patch.workflowRunId ?? undefined,
      started_at: patch.startedAt ?? undefined,
      completed_at: patch.completedAt ?? undefined,
    })
    .eq("id", generationId);

  if (error) {
    throw new Error(`Failed to update generation ${generationId}: ${error.message}`);
  }
}
