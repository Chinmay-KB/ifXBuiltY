import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { FEED_TILE_PREVIEW_SIZES } from "@/lib/generation-image-sizes";
import { formatCompactCount } from "@/lib/format-count";
import type { FeedItem } from "@/lib/feed-types";

const ACCENTS = [
  "bg-chrome text-ink",
  "bg-vote text-white",
  "bg-ink text-white",
  "bg-barrier text-white",
  "bg-remix text-white",
] as const;

type Props = {
  item: FeedItem;
  /** Stable index for accent rotation */
  index: number;
  /** Slight vertical offset for masonry rhythm */
  offsetClass?: string;
};

export function FeedTile({ item, index, offsetClass }: Props) {
  const accent = ACCENTS[index % ACCENTS.length]!;
  const title = `${item.builder} built ${item.target}`;

  return (
    <Link
      href={`/g/${item.slug}`}
      className={cn("group flex w-full flex-col gap-2.5 sm:max-w-[252px]", offsetClass)}
    >
      <div
        className={cn(
          "flex min-h-[220px] flex-col justify-between rounded-lg px-4 py-4 sm:min-h-[260px] sm:px-4 sm:py-4",
          accent,
        )}
      >
        <p className="font-display text-[1.35rem] leading-tight sm:text-[1.75rem] sm:leading-8">
          {title}
        </p>
        <div className="relative mt-3 h-16 shrink-0 overflow-hidden rounded-md bg-black/20 sm:h-20">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt=""
              fill
              sizes={FEED_TILE_PREVIEW_SIZES}
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-ink/30" aria-hidden />
          )}
        </div>
      </div>
      <div className="flex justify-between gap-2 text-[13px] font-semibold text-ink">
        <span>↑ {formatCompactCount(item.upvoteCount)}</span>
        <span>{item.remixCount} remixes</span>
        <span className="text-remix">Fork</span>
      </div>
    </Link>
  );
}
