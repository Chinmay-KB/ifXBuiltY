import Link from "next/link";

import { HomeFeedGrid } from "@/components/home-feed-grid";
import { ShowcaseRotator } from "@/components/showcase-rotator";
import { SHOWCASE_EXAMPLES } from "@/data/showcase-examples";
import { fetchFeedServer } from "@/lib/fetch-feed";

export default async function HomePage() {
  const { items } = await fetchFeedServer({ sort: "trending", limit: 20 });

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-8 px-4 pt-10 pb-12 sm:px-8 md:flex-row md:items-start md:gap-12 md:px-12 md:pt-14 md:pb-16">
        {/* Hero text + CTA */}
        <div className="flex max-w-lg flex-col items-center text-center md:items-start md:text-left">
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl">
            What if your favorite brand built something totally different?
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Generate hilarious parody screenshots. Combine any company with any
            product and watch AI bring it to life.
          </p>
          <Link
            href="/generate"
            className="mt-6 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-ink px-6 py-3 text-base font-semibold text-canvas transition-colors hover:bg-ink/90"
          >
            Start generating
          </Link>
        </div>

        {/* Showcase rotator — continuously cycling motion element */}
        <div className="w-full max-w-sm md:max-w-md">
          <ShowcaseRotator examples={SHOWCASE_EXAMPLES} />
        </div>
      </section>

      {/* Feed Section */}
      <section className="flex-1 px-4 pb-12 sm:px-8 md:px-12">
        {items.length > 0 ? (
          <>
            <h2 className="mb-6 font-display text-xl text-ink sm:text-2xl">
              Trending creations
            </h2>
            <HomeFeedGrid initialItems={items} />
          </>
        ) : (
          /* Empty state when no published generations */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="font-display text-2xl text-ink">
              No creations yet
            </h2>
            <p className="mt-3 max-w-md text-base text-muted-foreground">
              Be the first to generate a parody screenshot. Pick a brand, pick a
              product, and let AI do the rest.
            </p>
            <Link
              href="/generate"
              className="mt-6 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-ink px-6 py-3 text-base font-semibold text-canvas transition-colors hover:bg-ink/90"
            >
              Create the first one
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
