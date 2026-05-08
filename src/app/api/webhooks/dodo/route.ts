import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { getDodoClient } from '@/lib/dodo/client';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const client = getDodoClient({ includeWebhookKey: true });

  // Dodo uses Svix for webhook deliveries. Depending on the delivery mechanism,
  // headers may be `svix-*` or `webhook-*`. `standardwebhooks` expects the header
  // names exactly as received, so we pass through whichever set exists.
  const svixId = req.headers.get('svix-id') ?? '';
  const svixSig = req.headers.get('svix-signature') ?? '';
  const svixTs = req.headers.get('svix-timestamp') ?? '';

  const webhookId = req.headers.get('webhook-id') ?? '';
  const webhookSig = req.headers.get('webhook-signature') ?? '';
  const webhookTs = req.headers.get('webhook-timestamp') ?? '';

  const headersMap: Record<string, string> =
    svixId || svixSig || svixTs
      ? {
          'svix-id': svixId,
          'svix-signature': svixSig,
          'svix-timestamp': svixTs,
        }
      : {
          'webhook-id': webhookId,
          'webhook-signature': webhookSig,
          'webhook-timestamp': webhookTs,
        };

  const receiptHeaderKey =
    'svix-id' in headersMap ? 'svix-id' : 'webhook-id';

  let event: ReturnType<typeof client.webhooks.unwrap>;
  try {
    console.info('[dodo:webhook] verify:start', {
      hasSvixHeaders: Boolean(svixId || svixSig || svixTs),
      hasWebhookHeaders: Boolean(webhookId || webhookSig || webhookTs),
      bodyLength: rawBody.length,
    });
    event = client.webhooks.unwrap(rawBody, { headers: headersMap });
  } catch (e) {
    console.error('[dodo:webhook] verify:failed', {
      message: e instanceof Error ? e.message : String(e),
      headerKeys: Object.keys(headersMap),
      idPresent: Boolean(headersMap[receiptHeaderKey]),
      tsPresent: Boolean(
        headersMap['svix-timestamp'] || headersMap['webhook-timestamp'],
      ),
      sigPresent: Boolean(
        headersMap['svix-signature'] || headersMap['webhook-signature'],
      ),
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[dodo:webhook] missing service role key', { message: msg });
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  // Idempotency: dedupe by webhook-id after signature verification and before side-effects
  const receiptId = headersMap[receiptHeaderKey];
  if (receiptId) {
    const { data: existing, error: readErr } = await service
      .from('dodo_webhook_receipts')
      .select('id')
      .eq('id', receiptId)
      .maybeSingle();

    if (!readErr && existing) {
      return NextResponse.json({ received: true, deduped: true });
    }

    // Insert receipt row to guard subsequent retries
    const { error: writeErr } = await service
      .from('dodo_webhook_receipts')
      .insert({ id: receiptId });
    if (writeErr) {
      // Log but proceed; we still want to process the event
      console.error('Failed to write webhook receipt', writeErr);
    }
  }

  try {
    console.info('[dodo:webhook] received', { type: event.type });
    switch (event.type) {
      case 'payment.succeeded': {
        const payment = event.data;
        const dodoCustomerId = payment.customer.customer_id;
        const email = payment.customer.email;

        // Set during checkoutSessions.create metadata
        const supabaseUserId = (payment.metadata?.supabase_user_id as string | undefined) ?? undefined;

        if (supabaseUserId && dodoCustomerId) {
          const { error } = await service
            .from('dodo_customers')
            .upsert(
              {
                user_id: supabaseUserId,
                customer_id: dodoCustomerId,
                email,
              },
              { onConflict: 'user_id' },
            );

          if (error) {
            console.error('Failed to upsert dodo_customers mapping', error);
          }
        }
        break;
      }

      case 'refund.succeeded': {
        // If automatic clawback isn't enabled, optionally create a manual debit here using:
        // await client.creditEntitlements.balances.createLedgerEntry(customerId, { credit_entitlement_id, entry_type: 'debit', amount: '1', reason: 'refund' })
        break;
      }

      case 'credit.balance_low': {
        // Optionally notify the user or degrade service quality to conserve costs.
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}