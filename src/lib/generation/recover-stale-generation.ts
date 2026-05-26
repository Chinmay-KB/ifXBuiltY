import { updateGenerationStatus } from "@/lib/generation/db";
import { runGenerationJobSafe } from "@/lib/generation/generation-job-runner";
import type { GenerationJobInput } from "@/lib/generation/run-generation-job";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/** Stuck queued rows older than this are re-run on status poll. */
export const STALE_QUEUED_MS = 30_000;

/** Stuck processing rows older than this are re-run on status poll. */
export const STALE_PROCESSING_MS =
  process.env.VERCEL === "1" ? 6 * 60_000 : 90_000;

async function loadJobInputForGeneration(
  generationId: number,
  creatorId: string,
): Promise<GenerationJobInput | null> {
  const service = createSupabaseServiceClient();
  const { data: mapping } = await service
    .from("dodo_customers")
    .select("customer_id")
    .eq("user_id", creatorId)
    .maybeSingle();

  if (!mapping?.customer_id) return null;

  return {
    generationId,
    userId: creatorId,
    dodoCustomerId: mapping.customer_id,
    builderId: null,
  };
}

/**
 * Runs a stuck generation inline (awaited). Returns true if a recovery run started.
 */
export async function recoverStaleGenerationById(
  generationId: number,
): Promise<boolean> {
  const service = createSupabaseServiceClient();

  const { data: row } = await service
    .from("generations")
    .select("id, creator_id, status, created_at, started_at")
    .eq("id", generationId)
    .maybeSingle();

  if (!row) return false;

  const now = Date.now();
  const createdAge = now - new Date(row.created_at).getTime();
  const startedAge = row.started_at
    ? now - new Date(row.started_at).getTime()
    : createdAge;

  const isStaleQueued =
    row.status === "queued" &&
    Number.isFinite(createdAge) &&
    createdAge >= STALE_QUEUED_MS;
  const isStaleProcessing =
    row.status === "processing" &&
    Number.isFinite(startedAge) &&
    startedAge >= STALE_PROCESSING_MS;

  if (!isStaleQueued && !isStaleProcessing) return false;

  const input = await loadJobInputForGeneration(generationId, row.creator_id);
  if (!input) {
    await updateGenerationStatus(generationId, {
      status: "failed",
      errorMessage: "Billing account not found for recovery",
      completedAt: new Date().toISOString(),
    });
    return true;
  }

  const claimStartedAt = new Date().toISOString();

  if (isStaleQueued) {
    const { data: claimed } = await service
      .from("generations")
      .update({
        status: "processing",
        started_at: claimStartedAt,
        error_message: null,
      })
      .eq("id", generationId)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();

    if (!claimed) return false;
  } else {
    const staleBefore = new Date(now - STALE_PROCESSING_MS).toISOString();
    const { data: claimed } = await service
      .from("generations")
      .update({
        started_at: claimStartedAt,
        error_message: null,
      })
      .eq("id", generationId)
      .eq("status", "processing")
      .lte("started_at", staleBefore)
      .select("id")
      .maybeSingle();

    if (!claimed) return false;
  }

  console.warn(
    `[generation] recovering stale ${row.status} job ${generationId} via inline runner`,
  );

  // Do not await — status polls must stay fast; HMR can kill long requests.
  void runGenerationJobSafe(input);
  return true;
}
