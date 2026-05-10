import { NextResponse } from "next/server";

import { fillFourUniqueSlots } from "@/lib/prompt/merge-company-pair";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/slots
 * Returns 4 random unique company pair slots for the batch generator.
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
    const slots = await fillFourUniqueSlots();
    return NextResponse.json({ slots });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate slots";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
