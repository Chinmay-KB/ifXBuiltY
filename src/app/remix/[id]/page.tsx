import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function RemixPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <SiteHeader user={user} active="generate" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">
          Remix chain
        </p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          Remix <span className="text-muted-foreground">#{id}</span>
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          The generator will preload this parent soon. For now, open the home
          generator and paste the same idea — or jump back and hit{" "}
          <strong className="text-ink">Generate</strong> from scratch.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border-2 border-ink bg-chrome px-5 py-3 text-base font-black text-ink hover:brightness-[0.98]"
          >
            Open generator
          </Link>
        </div>
      </main>
    </div>
  );
}
