import { NextResponse } from "next/server";

import { getOrCreateAnonSessionId } from "@/lib/anon-session";
import { parseGenerationIdParam } from "@/lib/parse-generation-id";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

type VoteBody = {
  value?: unknown;
  vote?: unknown;
};

function parseVoteValue(v: unknown): 1 | -1 | null {
  const n = typeof v === "number" ? v : Number(v);
  if (n === 1 || n === -1) return n;
  return null;
}

export async function POST(request: Request, context: RouteContext) {
  const { id: idStr } = await context.params;
  const id = parseGenerationIdParam(idStr);
  if (id == null) {
    return NextResponse.json({ error: "Invalid generation id" }, { status: 400 });
  }

  let body: VoteBody;
  try {
    body = (await request.json()) as VoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const voteValue = parseVoteValue(body.value ?? body.vote);
  if (voteValue == null) {
    return NextResponse.json(
      { error: "vote must be 1 or -1", field: "value" },
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
    .select("id")
    .eq("id", id)
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .maybeSingle();

  if (genErr || !gen) {
    return NextResponse.json(
      { error: "Generation not found or not votable" },
      { status: 404 },
    );
  }

  const { sessionId, applyCookie } = await getOrCreateAnonSessionId();

  const { error: voteErr } = await service.from("votes").upsert(
    {
      generation_id: id,
      anon_session_id: sessionId,
      vote_value: voteValue,
    },
    { onConflict: "generation_id,anon_session_id" },
  );

  if (voteErr) {
    return NextResponse.json(
      { error: "Could not save vote", detail: voteErr.message },
      { status: 500 },
    );
  }

  const { data: counts, error: cErr } = await service
    .from("generations")
    .select("upvote_count, downvote_count, net_score")
    .eq("id", id)
    .maybeSingle();

  if (cErr || !counts) {
    const res = NextResponse.json({
      ok: true,
      generationId: id,
      voteValue,
    });
    applyCookie(res);
    return res;
  }

  const res = NextResponse.json({
    ok: true,
    generationId: id,
    voteValue,
    upvoteCount: counts.upvote_count,
    downvoteCount: counts.downvote_count,
    netScore: counts.net_score,
  });
  applyCookie(res);
  return res;
}
