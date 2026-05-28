"use client";

import { GenerationCard } from "@/components/generation-card";
import type { FeedItem } from "@/lib/ui/types";

type CreatorSummary = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export function PublicProfilePageClient({
  creator,
  items,
}: {
  creator: CreatorSummary;
  items: FeedItem[];
}) {
  const displayName = creator.displayName.trim() || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 pb-8">
        {creator.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.avatarUrl}
            alt=""
            className="size-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-panel text-xl font-bold text-ink">
            {initial}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-ink">{displayName}</h1>
          <p className="text-xs text-muted">Public profile</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-lg font-semibold text-ink">No published generations yet</p>
          <p className="text-sm text-muted">
            Only completed generations with images show up here.
          </p>
        </div>
      ) : (
        <div className="masonry-feed gap-4">
          {items.map((item, idx) => (
            <div key={item.id} className="mb-4 break-inside-avoid">
              <GenerationCard item={item} variant="paper" imagePriority={idx < 2} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

