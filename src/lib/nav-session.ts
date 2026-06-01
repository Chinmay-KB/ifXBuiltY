import "server-only";

import { isSuperadmin as isSuperadminEmail } from "@/lib/admin-constants";
import { navUserFromAuthUser, type NavUser } from "@/lib/nav-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { NavUser } from "@/lib/nav-user";

export type NavSession = {
  user: NavUser | null;
  isSuperadmin: boolean;
};

/** Reads the current Supabase session for SSR nav chrome (header / mobile bar). */
export async function getServerNavSession(): Promise<NavSession> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { user: null, isSuperadmin: false };
  }

  return {
    user: navUserFromAuthUser(authUser),
    isSuperadmin: isSuperadminEmail(authUser.email),
  };
}
