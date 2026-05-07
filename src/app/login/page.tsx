import Link from "next/link";

import { GoogleSignInButton } from "@/components/google-sign-in-button";

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;
  const nextPath =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-8 px-6 py-16">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Use Google to create an account or sign in. You need a session to
          generate and publish.
        </p>
      </header>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <GoogleSignInButton nextPath={nextPath} />

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        <Link href="/" className="underline-offset-4 hover:underline">
          ← Back home
        </Link>
      </p>
    </div>
  );
}
