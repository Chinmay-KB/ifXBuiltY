import { NextResponse } from "next/server";

import { assertDodoEntitlementConfigured, getDodoClient } from "@/lib/dodo/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: mapping, error: mapErr } = await supabase
    .from("dodo_customers")
    .select("customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (mapErr) {
    console.error("[credits:balance] read dodo_customers failed", {
      message: mapErr.message,
      userId: user.id,
    });
    return NextResponse.json(
      { error: "Could not load billing profile" },
      { status: 500 },
    );
  }

  const dodoCustomerId = mapping?.customer_id ?? null;
  if (!dodoCustomerId) {
    return NextResponse.json({ credits: 0, configured: true, hasCustomer: false });
  }

  const entitlementId = assertDodoEntitlementConfigured();
  const dodo = getDodoClient();

  try {
    const bal = await dodo.creditEntitlements.balances.retrieve(dodoCustomerId, {
      credit_entitlement_id: entitlementId,
    });
    const credits = Number(bal.balance ?? "0");
    return NextResponse.json({
      credits: Number.isFinite(credits) ? credits : 0,
      configured: true,
      hasCustomer: true,
    });
  } catch (e) {
    console.error("[credits:balance] dodo retrieve balance failed", {
      message: e instanceof Error ? e.message : String(e),
      // don't log customerId
    });
    return NextResponse.json(
      { error: "Unable to verify credits", code: "billing_unavailable" },
      { status: 503 },
    );
  }
}

