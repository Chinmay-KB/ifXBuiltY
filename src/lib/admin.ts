import type { User } from "@supabase/supabase-js";

import { isSuperadmin } from "@/lib/admin-constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Re-export client-safe constants from the shared module
export { SUPERADMIN_EMAIL, isSuperadmin } from "@/lib/admin-constants";

/** Thrown when an admin-only operation is attempted by a non-superadmin. */
export class AdminAuthError extends Error {
  constructor(message = "Forbidden: superadmin access required") {
    super(message);
    this.name = "AdminAuthError";
  }
}

/**
 * Verifies the current session belongs to the superadmin.
 * Throws `AdminAuthError` if the user is unauthenticated or not the superadmin.
 * Returns the authenticated `User` on success.
 */
export async function requireSuperadmin(): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !isSuperadmin(user.email)) {
    throw new AdminAuthError();
  }

  return user;
}
