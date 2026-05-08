import { NextResponse } from "next/server";

import { getOrCreateAnonSessionId } from "@/lib/anon-session";
import {
  REPORT_COUNT_HIDE_THRESHOLD,
} from "@/lib/constants";
import { parseGenerationIdParam } from "@/lib/parse-generation-id";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_REASON_LEN = 2000;

type ReportBody = {
  reason?: unknown;
};

export async function POST(request: Request, context: RouteContext) {
  const { id: idStr } = await context.params;
  const id = parseGenerationIdParam(idStr);
  if (id == null) {
    return NextResponse.json({ error: "Invalid generation id" }, { status: 400 });
  }

  let body: ReportBody;
  try {
    body = (await request.json()) as ReportBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const reason = String(body.reason ?? "").trim();
  if (!reason) {
    return NextResponse.json(
      { error: "reason is required", field: "reason" },
      { status: 400 },
    );
  }
  if (reason.length > MAX_REASON_LEN) {
    return NextResponse.json(
      { error: `reason must be at most ${MAX_REASON_LEN} characters` },
      { status: 400 },
    );
  }

  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server misconfiguration";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  const { data: gen, error: genErr } = await service
    .from("generations")
    .select("id, moderation_status, visibility")
    .eq("id", id)
    .eq("visibility", "published")
    .maybeSingle();

  if (genErr || !gen) {
    return NextResponse.json(
      { error: "Generation not found or not reportable" },
      { status: 404 },
    );
  }
  if (gen.moderation_status !== "visible") {
    return NextResponse.json(
      { error: "Generation is not reportable", code: "not_visible" },
      { status: 409 },
    );
  }

  const { sessionId, applyCookie } = await getOrCreateAnonSessionId();

  const { data: existing } = await service
    .from("reports")
    .select("id")
    .eq("generation_id", id)
    .eq("anon_session_id", sessionId)
    .maybeSingle();

  if (existing) {
    const res = NextResponse.json({
      ok: true,
      generationId: id,
      duplicate: true as const,
    });
    applyCookie(res);
    return res;
  }

  const { error: insErr } = await service.from("reports").insert({
    generation_id: id,
    anon_session_id: sessionId,
    reason,
  });

  if (insErr) {
    return NextResponse.json(
      { error: "Could not save report", detail: insErr.message },
      { status: 500 },
    );
  }

  const { data: after } = await service
    .from("generations")
    .select("report_count, moderation_status")
    .eq("id", id)
    .maybeSingle();

  if (
    after &&
    after.report_count >= REPORT_COUNT_HIDE_THRESHOLD &&
    after.moderation_status === "visible"
  ) {
    await service
      .from("generations")
      .update({ moderation_status: "hidden" })
      .eq("id", id)
      .eq("moderation_status", "visible");
  }

  const atThreshold =
    (after?.report_count ?? 0) >= REPORT_COUNT_HIDE_THRESHOLD;

  const res = NextResponse.json({
    ok: true,
    generationId: id,
    reportCount: after?.report_count ?? null,
    autoHidden: atThreshold,
  });
  applyCookie(res);
  return res;
}
