"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
    setPending(false);
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void signOut()}
      className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline disabled:opacity-50 dark:text-zinc-400"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
