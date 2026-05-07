"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  /** Post-login redirect path (must start with `/`, same origin only). */
  nextPath?: string;
};

export function GoogleSignInButton({ nextPath = "/" }: Props) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signIn() {
    setMessage(null);
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const next = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        setMessage(error.message);
        setPending(false);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sign-in failed");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => void signIn()}
        className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
      >
        {pending ? "Redirecting…" : "Continue with Google"}
      </button>
      {message ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
