import Link from "next/link";

import { CookOneLink } from "@/components/cook-one-link";
import { FeedTile } from "@/components/feed-tile";
import { SiteHeader } from "@/components/site-header";
import { fetchFeedServer } from "@/lib/fetch-feed";
import type { FeedSort } from "@/lib/feed-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ sort?: string }>;
};

export default async function FeedPage({ searchParams }: Props) {
  const { sort: raw } = await searchParams;
  const sort: FeedSort = raw === "trending" ? "trending" : "newest";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const feed = await fetchFeedServer({ sort, limit: 24 });

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <SiteHeader user={user} active="feed" />
      <div className="flex flex-col gap-6 border-b border-line px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:px-12 sm:py-8">
        <div className="min-w-0 max-w-3xl">
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-[42px] sm:leading-[2.75rem]">
            The wall of questionable taste
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Vote with your whole chest. Fork without shame.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Link
            href="/feed?sort=trending"
            className={
              sort === "trending"
                ? "inline-flex items-center justify-center rounded-full bg-ink px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-ink/90"
                : "inline-flex items-center justify-center rounded-full border border-line-strong bg-canvas px-3.5 py-2.5 text-sm font-extrabold text-ink hover:bg-panel"
            }
          >
            Hot
          </Link>
          <Link
            href="/feed?sort=newest"
            className={
              sort === "newest"
                ? "inline-flex items-center justify-center rounded-full bg-ink px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-ink/90"
                : "inline-flex items-center justify-center rounded-full border border-line-strong bg-canvas px-3.5 py-2.5 text-sm font-extrabold text-ink hover:bg-panel"
            }
          >
            Fresh
          </Link>
          <CookOneLink />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-4 py-8 sm:px-12 sm:py-10">
        {feed.items.length === 0 ? (
          <div className="max-w-md rounded-lg bg-panel p-5">
            <p className="text-xl font-black text-ink">No crimes yet</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This corner is suspiciously well-behaved. Cook the first one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {feed.items.map((item, i) => (
              <FeedTile key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
