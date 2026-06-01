import { NextResponse } from "next/server";

import { AdminAuthError, requireSuperadmin } from "@/lib/admin";
import { productApprovalHook } from "@/workflows/hooks/product-approval";

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

  let body: {
    toolCallId?: unknown;
    approved?: unknown;
    comment?: unknown;
    edits?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { toolCallId, approved, comment, edits } = body;

  if (typeof toolCallId !== "string" || !toolCallId || typeof approved !== "boolean") {
    return NextResponse.json(
      { error: "toolCallId and approved are required" },
      { status: 400 },
    );
  }

  try {
    await productApprovalHook.resume(toolCallId, {
      approved,
      comment: typeof comment === "string" ? comment : undefined,
      edits:
        edits !== null && typeof edits === "object" && !Array.isArray(edits)
          ? edits
          : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resume failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
