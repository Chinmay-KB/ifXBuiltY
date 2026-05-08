import { NextResponse } from "next/server";

import { getDodoClient } from "@/lib/dodo/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type Body = { sessionId?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dodo = getDodoClient();

  // 1) Resolve checkout session -> payment id/status
  let status;
  try {
    status = await dodo.checkoutSessions.retrieve(sessionId);
  } catch (e) {
    console.error("[credits:sync] checkoutSessions.retrieve failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "Unable to load checkout session", code: "dodo_unavailable" },
      { status: 503 },
    );
  }
  const paymentId = status.payment_id ?? null;
  const paymentStatus = status.payment_status ?? null;

  if (!paymentId) {
    return NextResponse.json(
      { error: "Checkout not completed yet", code: "checkout_incomplete" },
      { status: 409 },
    );
  }

  if (paymentStatus && paymentStatus !== "succeeded") {
    return NextResponse.json(
      { error: `Payment not succeeded (${paymentStatus})`, code: "payment_not_succeeded" },
      { status: 409 },
    );
  }

  // 2) Fetch payment to get customer id + metadata
  let payment;
  try {
    payment = await dodo.payments.retrieve(paymentId);
  } catch (e) {
    console.error("[credits:sync] payments.retrieve failed", {
      message: e instanceof Error ? e.message : String(e),
      paymentId,
    });
    return NextResponse.json(
      { error: "Unable to load payment", code: "dodo_unavailable" },
      { status: 503 },
    );
  }
  const claimedUserId = payment.metadata?.supabase_user_id ?? null;

  // Guard: only allow syncing payments that were created for this Supabase user.
  if (claimedUserId !== user.id) {
    return NextResponse.json({ error: "Payment does not belong to user" }, { status: 403 });
  }

  const customerId = payment.customer?.customer_id ?? null;
  const email = payment.customer?.email ?? null;

  if (!customerId) {
    return NextResponse.json({ error: "Missing customer id on payment" }, { status: 502 });
  }

  // 3) Persist mapping using service role (RLS restricts writes)
  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[credits:sync] missing service role key", { message: msg });
    return NextResponse.json({ error: msg }, { status: 503 });
  }
  const { error: upsertErr } = await service
    .from("dodo_customers")
    .upsert(
      { user_id: user.id, customer_id: customerId, email },
      { onConflict: "user_id" },
    );

  if (upsertErr) {
    console.error("[credits:sync] upsert dodo_customers failed", {
      message: upsertErr.message,
    });
    return NextResponse.json(
      { error: "Could not save billing profile", detail: upsertErr.message },
      { status: 500 },
    );
  }

  console.info("[credits:sync] ok", { userId: user.id });
  return NextResponse.json({ ok: true, customerId });
}

