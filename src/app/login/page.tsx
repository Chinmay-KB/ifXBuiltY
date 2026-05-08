import Link from "next/link";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { LogoMark, Surface, Wordmark } from "@/components/ui";

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;
  const nextPath =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center bg-panel px-4 py-12">
      <Link
        href="/"
        className="absolute left-4 top-4 flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink sm:left-12 sm:top-8"
      >
        ← Home
      </Link>
      <Surface variant="modal" className="relative z-10 w-full max-w-lg p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <LogoMark size="sm" />
          <Wordmark />
        </div>
        <div className="flex flex-col gap-2">
          <MicroLabelInline>One tiny checkpoint</MicroLabelInline>
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-[34px] sm:leading-9">
            Sign in to make the machine lie.
          </h1>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Your prompt stays put. We just need somewhere to attach the evidence.
        </p>

        {error ? (
          <p
            className="mt-4 rounded-lg border border-barrier/40 bg-barrier/10 px-3 py-2 text-sm text-barrier"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2.5">
          <GoogleSignInButton nextPath={nextPath} />
          <label className="sr-only" htmlFor="magic-email">
            Email for magic link
          </label>
          <input
            id="magic-email"
            type="email"
            disabled
            placeholder="Email for a magic link (soon)"
            className="h-12 w-full cursor-not-allowed rounded-lg border border-line-strong bg-canvas px-3.5 text-[15px] text-muted placeholder:text-muted"
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          No password ceremony. By continuing, you agree not to blame us for the
          bit.
        </p>
      </Surface>
    </div>
  );
}

function MicroLabelInline({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.12em] text-muted">
      {children}
    </span>
  );
}
