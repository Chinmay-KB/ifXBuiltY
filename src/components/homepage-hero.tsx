import { HomepageHeroCore, HomepageHeroStats } from "@/components/homepage-hero-core";
import { HomepageHeroDecorationsLoader } from "@/components/homepage-hero-decorations-loader";
import type { HeroFloatingThumb } from "@/lib/ui/types";

type HomepageHeroProps = {
  thumbnails: HeroFloatingThumb[];
  ideasThisWeek: number;
  totalPublished: number;
};

export function HomepageHero({
  thumbnails,
  ideasThisWeek,
  totalPublished,
}: HomepageHeroProps) {
  return (
    <section className="relative flex flex-col items-center">
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden px-5 pb-10 pt-12 md:min-h-[600px] md:px-12 md:pb-14 md:pt-16">
        <HomepageHeroDecorationsLoader thumbnails={thumbnails} />
        <HomepageHeroCore />
      </div>
      <HomepageHeroStats
        ideasThisWeek={ideasThisWeek}
        totalPublished={totalPublished}
      />
    </section>
  );
}
