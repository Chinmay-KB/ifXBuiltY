import type { User } from "@supabase/supabase-js";

import { assertDodoEntitlementConfigured, getDodoClient } from "@/lib/dodo/client";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const SIGNUP_BONUS_GRANT_TYPE = "signup_bonus" as const;

/** Default feature start: users created on/after this instant are eligible. */
const DEFAULT_FEATURE_START_ISO = "2026-05-26T20:00:00.000Z";

const SIGNUP_BONUS_AMOUNT = () => {
  const raw = process.env.SIGNUP_BONUS_CREDITS?.trim();
  if (!raw) return 3;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
};

function resolveFeatureStartAt(): Date {
  const raw = process.env.SIGNUP_BONUS_FEATURE_START_AT?.trim();
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(DEFAULT_FEATURE_START_ISO);
}

function isEligibleNewUser(createdAt: string | undefined, featureStart: Date): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return created.getTime() >= featureStart.getTime();
}

export type EnsureSignupBonusResult = {
  granted: boolean;
  customerId: string | null;
  skippedReason?:
    | "ineligible"
    | "already_granted"
    | "billing_unavailable"
    | "missing_email";
};

/**
 * Idempotently grants signup bonus credits to eligible new users.
 * Safe under concurrent calls (DB unique key + Dodo idempotency key).
 */
export async function ensureSignupBonusCredits(user: User): Promise<EnsureSignupBonusResult> {
  const email = user.email?.trim();
  if (!email) {
    return { granted: false, customerId: null, skippedReason: "missing_email" };
  }

  const featureStart = resolveFeatureStartAt();
  if (!isEligibleNewUser(user.created_at, featureStart)) {
    return { granted: false, customerId: null, skippedReason: "ineligible" };
  }

  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch {
    return { granted: false, customerId: null, skippedReason: "billing_unavailable" };
  }

  const amount = SIGNUP_BONUS_AMOUNT();

  const { data: existingGrant } = await service
    .from("credit_grants")
    .select("dodo_customer_id, dodo_ledger_entry_id, granted_at")
    .eq("user_id", user.id)
    .eq("grant_type", SIGNUP_BONUS_GRANT_TYPE)
    .maybeSingle();

  if (existingGrant?.granted_at && existingGrant.dodo_ledger_entry_id) {
    return {
      granted: false,
      customerId: existingGrant.dodo_customer_id ?? null,
      skippedReason: "already_granted",
    };
  }

  const { data: mapping } = await service
    .from("dodo_customers")
    .select("customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let dodoCustomerId = mapping?.customer_id ?? null;

  const dodo = getDodoClient();
  let entitlementId: string;
  try {
    entitlementId = assertDodoEntitlementConfigured();
  } catch {
    return { granted: false, customerId: dodoCustomerId, skippedReason: "billing_unavailable" };
  }

  if (!dodoCustomerId) {
    const name =
      (typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "") ||
      email.split("@")[0] ||
      "User";

    try {
      const customer = await dodo.customers.create({
        email,
        name,
        metadata: { supabase_user_id: user.id },
      });
      dodoCustomerId = customer.customer_id;
    } catch (e) {
      console.error("[signup-bonus] dodo customers.create failed", {
        message: e instanceof Error ? e.message : String(e),
        userId: user.id,
      });
      return { granted: false, customerId: null, skippedReason: "billing_unavailable" };
    }

    const { error: mapErr } = await service.from("dodo_customers").upsert(
      {
        user_id: user.id,
        customer_id: dodoCustomerId,
        email,
      },
      { onConflict: "user_id" },
    );

    if (mapErr) {
      console.error("[signup-bonus] upsert dodo_customers failed", {
        message: mapErr.message,
        userId: user.id,
      });
      return { granted: false, customerId: dodoCustomerId, skippedReason: "billing_unavailable" };
    }
  }

  if (!existingGrant) {
    const { error: insertErr } = await service.from("credit_grants").insert({
      user_id: user.id,
      grant_type: SIGNUP_BONUS_GRANT_TYPE,
      amount,
      dodo_customer_id: dodoCustomerId,
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        const { data: raced } = await service
          .from("credit_grants")
          .select("dodo_customer_id, dodo_ledger_entry_id, granted_at")
          .eq("user_id", user.id)
          .eq("grant_type", SIGNUP_BONUS_GRANT_TYPE)
          .maybeSingle();

        if (raced?.granted_at && raced.dodo_ledger_entry_id) {
          return {
            granted: false,
            customerId: raced.dodo_customer_id ?? dodoCustomerId,
            skippedReason: "already_granted",
          };
        }
      } else {
        console.error("[signup-bonus] insert credit_grants failed", {
          message: insertErr.message,
          userId: user.id,
        });
        return { granted: false, customerId: dodoCustomerId, skippedReason: "billing_unavailable" };
      }
    }
  }

  const idempotencyKey = `signup_bonus_${user.id}`;

  let ledgerEntryId: string;
  try {
    const entry = await dodo.creditEntitlements.balances.createLedgerEntry(dodoCustomerId, {
      credit_entitlement_id: entitlementId,
      entry_type: "credit",
      amount: String(amount),
      reason: "signup.bonus",
      idempotency_key: idempotencyKey,
      metadata: {
        grant_type: SIGNUP_BONUS_GRANT_TYPE,
        supabase_user_id: user.id,
      },
    });
    ledgerEntryId = entry.id;
  } catch (e) {
    console.error("[signup-bonus] createLedgerEntry failed", {
      message: e instanceof Error ? e.message : String(e),
      userId: user.id,
    });
    return { granted: false, customerId: dodoCustomerId, skippedReason: "billing_unavailable" };
  }

  const grantedAt = new Date().toISOString();
  const { error: updateErr } = await service
    .from("credit_grants")
    .update({
      dodo_customer_id: dodoCustomerId,
      dodo_ledger_entry_id: ledgerEntryId,
      granted_at: grantedAt,
      amount,
    })
    .eq("user_id", user.id)
    .eq("grant_type", SIGNUP_BONUS_GRANT_TYPE);

  if (updateErr) {
    console.error("[signup-bonus] update credit_grants failed", {
      message: updateErr.message,
      userId: user.id,
    });
  }

  console.info("[signup-bonus] granted", {
    userId: user.id,
    amount,
    ledgerEntryId,
  });

  return { granted: true, customerId: dodoCustomerId };
}
