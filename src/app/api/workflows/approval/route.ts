import { productApprovalHook } from "@/workflows/hooks/product-approval";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { toolCallId, approved, comment, edits } = await request.json();

  if (!toolCallId || typeof approved !== "boolean") {
    return NextResponse.json(
      { error: "toolCallId and approved are required" },
      { status: 400 },
    );
  }

  await productApprovalHook.resume(toolCallId, {
    approved,
    comment,
    edits,
  });

  return NextResponse.json({ success: true });
}
