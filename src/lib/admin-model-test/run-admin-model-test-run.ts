import { assertAiGatewayConfigured, getGenerationImagesBucket } from "@/lib/env-server";
import { updateAdminModelTestRun } from "@/lib/admin-model-test/db";
import { executeImageGeneration } from "@/lib/generation/execute-image";
import { normalizeRenderMode } from "@/lib/screen-type";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type AdminModelTestRunJobInput = {
  runId: string;
  userId: string;
};

type AdminModelTestRunContext = {
  runId: string;
  userId: string;
  prompt: string;
  builderId: string | null;
  builderName: string;
  imageModel: string;
  objectPath: string;
  renderMode: ReturnType<typeof normalizeRenderMode>;
};

async function loadRunContext(input: AdminModelTestRunJobInput): Promise<AdminModelTestRunContext> {
  assertAiGatewayConfigured();

  const supabase = createSupabaseServiceClient();
  const { data: row, error } = await supabase
    .from("admin_model_test_runs")
    .select("id, created_by, builder, generated_prompt, image_path, screen_type, model")
    .eq("id", input.runId)
    .eq("created_by", input.userId)
    .maybeSingle();

  if (error || !row?.generated_prompt) {
    throw new Error("Model test run not found");
  }

  const objectPath =
    row.image_path?.trim() || `${input.userId}/admin-model-test/${row.id}.png`;

  return {
    runId: row.id,
    userId: input.userId,
    prompt: row.generated_prompt,
    builderId: null,
    builderName: row.builder,
    imageModel: row.model,
    objectPath,
    renderMode: normalizeRenderMode(row.screen_type),
  };
}

export async function runAdminModelTestRun(
  input: AdminModelTestRunJobInput,
): Promise<{ runId: string; status: "completed" | "failed" }> {
  const started = performance.now();
  const startedAtIso = new Date().toISOString();

  try {
    await updateAdminModelTestRun(input.runId, {
      status: "processing",
      startedAt: startedAtIso,
      errorMessage: null,
    });

    const ctx = await loadRunContext(input);
    const bucket = getGenerationImagesBucket();

    const image = await executeImageGeneration({
      generationId: 0,
      userId: ctx.userId,
      dodoCustomerId: "",
      entitlementId: "",
      bucket,
      objectPath: ctx.objectPath,
      prompt: ctx.prompt,
      imageModel: ctx.imageModel,
      builderId: ctx.builderId,
      builderName: ctx.builderName,
      renderMode: ctx.renderMode,
    });

    const completedAtIso = new Date().toISOString();
    const durationMs = Math.max(0, Math.round(performance.now() - started));

    await updateAdminModelTestRun(input.runId, {
      status: "completed",
      completedAt: completedAtIso,
      durationMs,
      imagePath: image.imagePath,
      imageReady: true,
      errorMessage: null,
    });

    return { runId: input.runId, status: "completed" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Model test run failed";
    const completedAtIso = new Date().toISOString();
    const durationMs = Math.max(0, Math.round(performance.now() - started));

    await updateAdminModelTestRun(input.runId, {
      status: "failed",
      completedAt: completedAtIso,
      durationMs,
      errorMessage: msg,
    });

    return { runId: input.runId, status: "failed" };
  }
}

