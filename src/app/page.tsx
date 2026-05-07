import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          ifXBuiltY
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Generator scaffold — routes and API stubs from the technical plan.
        </p>
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
