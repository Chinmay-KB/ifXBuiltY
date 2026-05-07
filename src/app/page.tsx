import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          ifXBuiltY
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Generator scaffold — routes and API stubs from the technical plan.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-zinc-600 dark:text-zinc-400">
                Signed in as{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {user.email ?? user.id}
                </span>
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
            >
              Sign in with Google
            </Link>
          )}
        </div>
      </header>
      <nav className="flex flex-col gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        <Link className="underline-offset-4 hover:underline" href="/feed">
          /feed
        </Link>
        <span className="text-zinc-500">
          /g/[slug] — e.g.{" "}
          <Link className="underline-offset-4 hover:underline" href="/g/example">
            /g/example
          </Link>
        </span>
        <span className="text-zinc-500">
          /remix/[id] — e.g.{" "}
          <Link className="underline-offset-4 hover:underline" href="/remix/demo-id">
            /remix/…
          </Link>
        </span>
      </nav>
    </div>
  );
}
