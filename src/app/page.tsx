import Link from "next/link";

import { WallSection } from "@/components/wall-section";
import type { WallItem } from "@/components/wall-card";
import { fetchFeedServer } from "@/lib/fetch-feed";

export default async function HomePage() {
  const { items } = await fetchFeedServer({ sort: "trending", limit: 40 });

  // Map feed items to WallItem shape — only include items with images
  const wallItems: WallItem[] = items
    .filter((item) => item.imageUrl)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      imageUrl: item.imageUrl,
      builder: item.builder,
      target: item.target,
    }));

  return (
    <div className="flex flex-col">
      {/* The Wall — full viewport conveyor rows with dark bg */}
      {wallItems.length > 0 ? (
        <WallSection items={wallItems} />
      ) : (
        <section className="flex min-h-[60vh] flex-col items-center justify-center bg-ink px-4 text-center">
          <h1 className="font-display text-3xl text-white sm:text-5xl">
            What if your favorite brand built something{" "}
            <span className="text-chrome">totally different</span>?
          </h1>
          <p className="mt-4 text-base text-white/60 sm:text-lg">
            Combine any company with any product. AI generates the parody screenshot.
          </p>
          <Link
            href="/generate"
            className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-full bg-chrome px-8 py-3 text-base font-bold text-ink transition-all hover:scale-105"
          >
            Start generating →
          </Link>
        </section>
      )}

      {/* Below the wall — How it works + CTAs */}
      <section className="bg-canvas px-4 py-20 sm:px-8 md:px-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-2xl text-ink sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-chrome/20 font-display text-xl text-ink">
                1
              </span>
              <h3 className="text-lg font-semibold text-ink">Pick a brand</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Duolingo, Stripe, IKEA, your local government — the weirder the better.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-chrome/20 font-display text-xl text-ink">
                2
              </span>
              <h3 className="text-lg font-semibold text-ink">Pick a product</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                A dating app? Tax software? A funeral home booking system? Go wild.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-chrome/20 font-display text-xl text-ink">
                3
              </span>
              <h3 className="text-lg font-semibold text-ink">AI does the rest</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                A pixel-perfect parody screenshot in their actual design style. Share it, remix it.
              </p>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/generate"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-ink px-8 py-3 text-base font-semibold text-canvas transition-colors hover:bg-ink/90"
            >
              Start generating
            </Link>
            <Link
              href="/feed"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-line px-8 py-3 text-base font-semibold text-ink transition-colors hover:bg-panel"
            >
              Browse all creations
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
