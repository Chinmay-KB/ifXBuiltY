import DodoPayments from 'dodopayments';

type DodoMode = 'test_mode' | 'live_mode';

function resolveDodoEnvironment(): DodoMode {
  const cfg = process.env.DODO_ENV?.trim();
  if (cfg === 'test_mode' || cfg === 'live_mode') return cfg;
  return process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode';
}

let sharedClient: DodoPayments | null = null;
let sharedClientWithWebhook: DodoPayments | null = null;

export function getDodoClient(opts?: { includeWebhookKey?: boolean }): DodoPayments {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) {
    throw new Error('Missing DODO_PAYMENTS_API_KEY');
  }

  const environment = resolveDodoEnvironment();

  if (opts?.includeWebhookKey) {
    if (sharedClientWithWebhook) return sharedClientWithWebhook;

    const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    if (!webhookKey) {
      throw new Error('Missing DODO_PAYMENTS_WEBHOOK_KEY');
    }

    sharedClientWithWebhook = new DodoPayments({
      bearerToken,
      webhookKey,
      environment,
    });

    return sharedClientWithWebhook;
  }

  if (sharedClient) return sharedClient;

  sharedClient = new DodoPayments({
    bearerToken,
    environment,
  });

  return sharedClient;
}

export function assertDodoEntitlementConfigured(): string {
  const id = process.env.DODO_IMAGE_CREDITS_ENTITLEMENT_ID?.trim();
  if (!id) {
    throw new Error('Missing DODO_IMAGE_CREDITS_ENTITLEMENT_ID');
  }
  return id;
}