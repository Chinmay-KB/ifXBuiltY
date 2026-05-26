import { start } from "workflow/api";
import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { assertAiGatewayConfigured } from "@/lib/env-server";
import { discoverCompanyProducts } from "../../../../../workflows/discover-company-products";

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

  let body: { seedCompanyName?: string; seedCategory?: string; maxProducts?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    assertAiGatewayConfigured();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server misconfiguration";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  try {
    const run = await start(discoverCompanyProducts, [body]);
    return NextResponse.json({
      workflowRunId: run.runId,
      status: "started",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Workflow failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
