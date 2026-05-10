import { NextResponse } from "next/server";

import {
  mergeCompanyPair,
  randomDistinctPairIds,
} from "@/lib/prompt/merge-company-pair";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/slots/single
 * Returns a single random company pair slot for reshuffling one slot.
 * Requires authentication.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { builderId, targetId } = await randomDistinctPairIds();
    const fields = await mergeCompanyPair(builderId, targetId);
    return NextResponse.json({ slot: { builderId, targetId, fields } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate slot";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
