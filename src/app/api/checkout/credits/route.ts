import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getDodoClient } from '@/lib/dodo/client';
import type DodoPayments from 'dodopayments';

export const runtime = 'nodejs';

type Body = {
  productId?: string;
  returnUrl?: string | null;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const productId = body.productId?.trim();
  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = user.email ?? null;
  if (!email) {
    return NextResponse.json({ error: 'User account missing email; cannot create checkout session' }, { status: 400 });
  }
  const name = (user.user_metadata?.name as string | undefined) ?? undefined;

  const client = getDodoClient();

  const idempotencyKey = `checkout_${user.id}_${productId}_${Date.now()}`;

  const customer: Record<string, string | boolean> = {
    email,
    create_new_customer: true,
  };
  if (name) customer.name = name;

  const params: DodoPayments.CheckoutSessionCreateParams = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    // customer is accepted by the SDK type; using a cast to satisfy Record mapping
    customer: customer as unknown as { email: string; name?: string; create_new_customer: boolean },
    return_url: body.returnUrl ?? undefined,
    // Attach Supabase user id so webhook can map Dodo customer -> user
    metadata: { supabase_user_id: user.id },
  };

  const session: DodoPayments.CheckoutSessionResponse = await client.checkoutSessions.create(params, { idempotencyKey });

  const url = session.checkout_url ?? null;

  return NextResponse.json({ url, sessionId: session.session_id });
}