/**
 * Public Supabase config (safe for browser and server bootstrap).
 * Supports new publishable keys and legacy anon key.
 */
export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }

  return { url, anonKey };
}

export function tryGetSupabasePublicEnv(): { url: string; anonKey: string } | null {
  try {
    return getSupabasePublicEnv();
  } catch {
    return null;
  }
}
