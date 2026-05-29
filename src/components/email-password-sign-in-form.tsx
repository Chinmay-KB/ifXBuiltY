"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  /** Post-login redirect path (must start with `/`, same origin only). */
  nextPath?: string;
};

function safeNextPath(nextPath: string): string {
  return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
}

export function isEmailPasswordAuthEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_EMAIL_PASSWORD_AUTH === "1"
  );
}

export function EmailPasswordSignInForm({ nextPath = "/" }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setMessage("Enter an email and password.");
      return;
    }

    setPending(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const signIn = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (!signIn.error) {
        window.location.href = safeNextPath(nextPath);
        return;
      }

      const signUp = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUp.error) {
        setMessage(signIn.error.message);
        return;
      }

      if (signUp.data.session) {
        window.location.href = safeNextPath(nextPath);
        return;
      }

      setMessage("Check your email to confirm this test account.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Email sign-in failed");
    } finally {
      setPending(false);
    }
  }

  if (!isEmailPasswordAuthEnabled()) return null;

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-line-strong bg-panel p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-[0.08em] text-muted" htmlFor="email-login-email">
          Test email
        </label>
        <input
          id="email-login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-line-strong bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-[0.08em] text-muted" htmlFor="email-login-password">
          Test password
        </label>
        <input
          id="email-login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-line-strong bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
      </div>
      <Button type="submit" variant="outline" size="md" disabled={pending}>
        {pending ? "Signing in..." : "Continue with test email"}
      </Button>
      {message ? (
        <p className="text-sm font-medium text-barrier" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
