import { createClient } from "@supabase/supabase-js";

import type { GenerationsSelectClient } from "@/lib/feed-public-filters";
import { tryGetSupabasePublicEnv } from "@/lib/supabase/public-env";

/**
 * Anonymous Supabase client for public feed queries (homepage cache, ISR).
 */
export function createPublicFeedClient(): GenerationsSelectClient | null {
  const env = tryGetSupabasePublicEnv();
  if (!env) return null;

  return createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }) as unknown as GenerationsSelectClient;
}

/**
 * Adapts a Supabase server/browser client to the minimal feed query surface.
 */
export function asGenerationsSelectClient(client: unknown): GenerationsSelectClient {
  return client as GenerationsSelectClient;
}
