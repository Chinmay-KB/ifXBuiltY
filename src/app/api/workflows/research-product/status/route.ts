import { getRun } from "workflow/api";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json(
      { error: "runId is required" },
      { status: 400 },
    );
  }

  try {
    const run = getRun(runId);
    const [status, exists] = await Promise.all([run.status, run.exists]);

    return NextResponse.json({
      runId,
      status,
      exists,
    });
  } catch {
    return NextResponse.json(
      { error: "Run not found" },
      { status: 404 },
    );
  }
}
