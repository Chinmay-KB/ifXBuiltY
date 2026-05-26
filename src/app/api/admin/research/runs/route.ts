import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { listResearchRuns } from "@/lib/research/db";

export async function GET() {
  try {
    await requireSuperadmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }

  const runs = await listResearchRuns();
  return NextResponse.json(runs);
}
