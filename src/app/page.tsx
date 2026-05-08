import Link from "next/link";

import { FeedTile } from "@/components/feed-tile";
import { HomeGenerator } from "@/components/home-generator";
import { SiteHeader } from "@/components/site-header";
import { fetchFeedServer } from "@/lib/fetch-feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STAGGER = ["", "sm:pt-8", "", "sm:pt-5", ""];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const feed = await fetchFeedServer({ sort: "trending", limit: 8 });

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <SiteHeader user={user} active="generate" />
      <main className="flex flex-1 flex-col px-4 py-8 sm:px-12 sm:py-10">
        <HomeGenerator signedIn={!!user} />
        <section className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-black leading-snug text-ink sm:text-[28px]">
              Hot off the lab bench
            </h2>
            <div className="flex gap-2">
              <Link
                href="/feed?sort=trending"
                className="inline-flex items-center justify-center rounded-full bg-ink px-3.5 py-2 text-[13px] font-extrabold text-white hover:bg-ink/90"
              >
                Hot
              </Link>
              <Link
                href="/feed?sort=newest"
                className="inline-flex items-center justify-center rounded-full border border-line-strong bg-canvas px-3.5 py-2 text-[13px] font-extrabold text-ink hover:bg-panel"
              >
                Fresh
              </Link>
            </div>
          </div>
          {feed.items.length === 0 ? (
            <p className="max-w-xl text-base text-muted-foreground">
              Nothing published yet. Be the first to ship something cursed — generate, then publish.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4 lg:flex-nowrap lg:justify-between">
              {feed.items.slice(0, 5).map((item, i) => (
                <FeedTile
                  key={item.id}
                  item={item}
                  index={i}
                  offsetClass={STAGGER[i] ?? ""}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
