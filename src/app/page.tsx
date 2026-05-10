import type { Metadata } from "next";
import Link from "next/link";

import { WallSection } from "@/components/wall-section";
import type { WallItem } from "@/components/wall-card";
import { fetchFeedServer } from "@/lib/fetch-feed";

export const metadata: Metadata = {
  title: {
    absolute:
      "ifXBuiltY — What if X built Y? AI parody screenshots from parallel universes",
  },
  description:
    "Explore product design from parallel universes. Combine any company with any product and get an AI-generated parody screenshot. One prompt. Infinite timelines.",
  alternates: { canonical: "/" },
};

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
      {/* The Wall — full viewport conveyor rows with floating prompt */}
      {wallItems.length > 0 ? (
        <WallSection items={wallItems} />
      ) : (
        /* Empty state when no generations exist yet */
        <section className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center bg-ink px-4 text-center">
          <h1 className="font-display text-3xl font-black text-white sm:text-5xl">
            What if X built Y?
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
            Explore product design from parallel universes. One prompt. Infinite timelines.
          </p>
          <Link
            href="/generate"
            className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-chrome px-8 py-3 text-base font-bold text-ink transition-all hover:scale-105"
          >
            Start generating →
          </Link>
        </section>
      )}
    </div>
  );
}
