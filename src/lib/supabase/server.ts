import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv } from "@/lib/supabase/public-env";

/**
 * Server Components, Server Actions, and Route Handlers.
 * Cookie writes may no-op when called outside a mutable response context; the proxy refreshes sessions.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        void headersToSet;
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* RSC cookie store may be read-only; proxy handles refresh + cache headers */
        }
      },
    },
  });
}
