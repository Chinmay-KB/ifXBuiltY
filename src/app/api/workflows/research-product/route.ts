import { start } from "workflow/api";
import { NextResponse } from "next/server";

import { assertAiGatewayConfigured } from "@/lib/env-server";
import { researchProduct } from "@/workflows/research-product";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { productId } = await request.json();

  if (!productId || typeof productId !== "string") {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 },
    );
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
