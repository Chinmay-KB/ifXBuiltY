"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  /** Post-login redirect path (must start with `/`, same origin only). */
  nextPath?: string;
};

export function GoogleSignInButton({ nextPath = "/" }: Props) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const NEXT_COOKIE = "ifxb_next";

  async function signIn() {
    setMessage(null);
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const next =
        nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
      // Store post-login destination in a short-lived cookie so the OAuth redirect URL
      // can stay stable and match Supabase allow-lists exactly.
      document.cookie = `${NEXT_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=600; SameSite=Lax`;
      const redirectTo = `${window.location.origin}/auth/callback`;
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
      <Button
        variant="ink"
        size="lg"
        className="min-h-[52px] w-full gap-2.5 font-black"
        disabled={pending}
        onClick={() => void signIn()}
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-black text-ink">
          G
        </span>
        {pending ? "Redirecting…" : "Continue with Google"}
      </Button>
      {message ? (
        <p className="text-sm font-medium text-barrier" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
