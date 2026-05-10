"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import Zoom from "@/components/image-zoom";
import { cn } from "@/lib/cn";

type UserProfile = {
  id: string;
  email?: string;
  avatar_url?: string;
  display_name?: string;
  created_at: string;
};

type Generation = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  imageUrl: string | null;
  visibility: string;
  netScore: number;
  createdAt: string;
};

export function ProfilePageClient({ user }: { user: UserProfile }) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const displayName = user.display_name ?? user.email ?? "User";
  const joinDate = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const fetchGenerations = useCallback(
    async (off: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetch(
          `/api/generations/mine?limit=20&offset=${off}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (append) {
          setGenerations((prev) => [...prev, ...(data.items as Generation[])]);
        } else {
          setGenerations(data.items as Generation[]);
        }
        setHasMore(data.hasMore);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    setOffset(0);
    void fetchGenerations(0, false);
  }, [fetchGenerations]);

  const handleLoadMore = () => {
    const newOffset = offset + 20;
    setOffset(newOffset);
    void fetchGenerations(newOffset, true);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 pb-8">
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt=""
            className="size-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-panel text-xl font-bold text-ink">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-ink">{displayName}</h1>
          {user.email && user.display_name && (
            <p className="text-sm text-muted">{user.email}</p>
          )}
          <p className="text-xs text-muted">Joined {joinDate}</p>
        </div>
      </div>

      {/* Generations grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] animate-pulse rounded-xl bg-panel"
            />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-lg font-semibold text-ink">No generations yet</p>
          <p className="text-sm text-muted">
            Create and publish a generation to see it here.
          </p>
          <Link
            href="/generate"
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
          >
            Generate one
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            {generations.map((gen) => (
              <GenerationCard key={gen.id} generation={gen} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center rounded-lg border-2 border-line-strong bg-canvas px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-panel disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Generation Card ─── */

function GenerationCard({ generation }: { generation: Generation }) {
  const title = `${generation.builder} × ${generation.target}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-line bg-canvas transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-panel">
        {generation.imageUrl ? (
          <Zoom>
            {/* eslint-disable-next-line @next/next/no-img-element -- rmiz measures native <img>; Next/Image breaks zoom geometry */}
            <img
              src={generation.imageUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </Zoom>
        ) : null}
      </div>

      <Link
        href={`/g/${generation.slug}`}
        className="flex items-center gap-2 p-3"
        aria-label={`Open ${title}`}
      >
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          {title}
        </p>

        {/* Net score — simple, themed */}
        {generation.visibility === "published" && generation.netScore !== 0 && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
              generation.netScore > 0
                ? "bg-chrome/20 text-ink"
                : "bg-panel text-muted",
            )}
          >
            {generation.netScore > 0 ? "+" : ""}
            {generation.netScore}
          </span>
        )}

        {/* Date */}
        <span className="shrink-0 text-xs text-muted">
          {new Date(generation.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </Link>
    </div>
  );
}
