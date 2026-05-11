import type { Metadata } from "next";

import { HomePaperHero } from "@/components/home-paper-hero";

export const metadata: Metadata = {
  title: {
    absolute:
      "ifXBuiltY — What if X built Y? AI parody screenshots from parallel universes",
  },
  description:
    "Crossbreed any company with any product. Watch the UI write itself. One prompt, one weird little world. Browse the feed, vote, remix, and share.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HomePaperHero />
    </div>
  );
}
