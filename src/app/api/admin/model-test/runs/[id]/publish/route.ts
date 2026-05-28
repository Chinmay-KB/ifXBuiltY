import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { ensureGenerationVariants } from "@/lib/generation/ensure-variants";
import { makeGenerationSlugSnippet } from "@/lib/slug";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { updateAdminModelTestRun } from "@/lib/admin-model-test/db";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  let adminUser;
  try {
    adminUser = await requireSuperadmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }

  const { id: runId } = await context.params;
  if (!runId || typeof runId !== "string") {
    return NextResponse.json({ error: "Invalid run id" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: run, error: selErr } = await supabase
    .from("admin_model_test_runs")
    .select(
      "id, created_by, builder, target, tone, screen_type, extra_details, generated_prompt, image_path, image_ready, status, publish_state, published_generation_id",
    )
    .eq("id", runId)
    .maybeSingle();

  if (selErr || !run) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (run.created_by !== adminUser.id) {
    // superadmin can still publish; keep the safety in case RLS is relaxed in future
    // but requireSuperadmin already gates access.
  }

  if (run.publish_state === "published" && run.published_generation_id) {
    return NextResponse.json({
      ok: true,
      publishState: "published" as const,
      publishedGenerationId: run.published_generation_id,
    });
  }

  if (run.status !== "completed" || !run.image_ready || !run.image_path?.trim()) {
    return NextResponse.json(
      { error: "Run must be completed with an image to publish" },
      { status: 400 },
    );
  }

  try {
    await ensureGenerationVariants({ service: supabase, originalPath: run.image_path.trim() });
  } catch {
    return NextResponse.json(
      { error: "Could not publish (variant generation failed)" },
      { status: 500 },
    );
  }

  const baseSlug = makeGenerationSlugSnippet({
    builder: run.builder ?? "",
    target: run.target ?? "",
  });
  const plannedExt = "png";

  let inserted:
    | {
        id: number;
        slug: string;
      }
    | undefined;

  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug.slice(0, 32)}-${attempt}`;

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        creator_id: adminUser.id,
        slug,
        builder: run.builder ?? "",
        target: run.target ?? "",
        tone: (run.tone ?? "").slice(0, 80),
        screen_type: run.screen_type ?? "desktop",
        region: "",
        extra_details: run.extra_details ?? "",
        generated_prompt: run.generated_prompt ?? null,
        image_path: run.image_path.trim() || `${adminUser.id}/${slug}.${plannedExt}`,
        visibility: "published",
        moderation_status: "visible",
        status: "completed",
        image_ready: true,
        completed_at: new Date().toISOString(),
      })
      .select("id, slug")
      .maybeSingle();

    if (!insErr && row) {
      inserted = row;
      break;
    }

    if (insErr?.code === "23505") continue;
    return NextResponse.json(
      { error: "Could not publish to public generations", detail: insErr?.message },
      { status: 500 },
    );
  }

  if (!inserted) {
    return NextResponse.json(
      { error: "Could not allocate unique slug" },
      { status: 500 },
    );
  }

  await updateAdminModelTestRun(runId, {
    publishState: "published",
    publishedGenerationId: inserted.id,
  });

  return NextResponse.json({
    ok: true,
    publishState: "published" as const,
    publishedGenerationId: inserted.id,
    slug: inserted.slug,
  });
}

