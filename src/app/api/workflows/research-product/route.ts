import { start } from "workflow/api";
import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { assertAiGatewayConfigured } from "@/lib/env-server";
import { researchProduct } from "@/workflows/research-product";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireSuperadmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }

  const { productId } = await request.json();

  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  try {
    assertAiGatewayConfigured();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server misconfiguration";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  const run = await start(researchProduct, [productId]);

  return NextResponse.json({
    runId: run.runId,
    status: "started",
    productId,
  });
}
