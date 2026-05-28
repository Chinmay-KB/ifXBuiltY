import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { generationMediaPath } from "@/lib/generation-media-url";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { FeedItem } from "@/lib/ui/types";

import { PublicProfilePageClient } from "./public-profile-page-client";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

type CreatorSummary = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
};

async function fetchCreatorSummary(userId: string): Promise<CreatorSummary | null> {
  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch {
    return null;
  }

  const { data, error } = await service
    .from("auth.users")
    .select("id, raw_user_meta_data")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.id) return null;

  const meta = data.raw_user_meta_data as
    | {
        full_name?: unknown;
        name?: unknown;
        avatar_url?: unknown;
      }
    | null
    | undefined;

  const rawName =
    typeof meta?.full_name === "string"
      ? meta.full_name
      : typeof meta?.name === "string"
        ? meta.name
        : "";
  const displayName = rawName.trim() || null;

  const rawAvatar = typeof meta?.avatar_url === "string" ? meta.avatar_url : "";
  const avatarUrl = rawAvatar.trim() || null;

  return { id: data.id as string, displayName, avatarUrl };
}

type GenerationRow = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  screen_type: string | null;
  image_path: string | null;
  image_ready: boolean | null;
  net_score: number | null;
  remix_count: number | null;
  created_at: string;
};

async function fetchPublicGenerations(userId: string): Promise<FeedItem[]> {
  const service = createSupabaseServiceClient();

  const { data, error } = await service
    .from("generations")
    .select(
      "id, slug, builder, target, screen_type, image_path, image_ready, net_score, remix_count, created_at",
    )
    .eq("creator_id", userId)
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .eq("status", "completed")
    .eq("image_ready", true)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error || !data) return [];

  return (data as GenerationRow[])
    .filter((row) => Boolean(row.image_path?.trim()))
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      builder: row.builder,
      target: row.target,
      imageUrl: generationMediaPath(row.slug, "card"),
      netScore: row.net_score ?? 0,
      remixCount: row.remix_count ?? 0,
      createdAt: row.created_at,
      screenType: row.screen_type ?? undefined,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const creator = await fetchCreatorSummary(id);
  const title = creator?.displayName?.trim()
    ? `${creator.displayName} — Profile`
    : "Profile";
  return { title };
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;

  const creator = await fetchCreatorSummary(id);
  if (!creator) notFound();

  const items = await fetchPublicGenerations(id);

  return (
    <PublicProfilePageClient
      creator={{
        id: creator.id,
        displayName: creator.displayName ?? "User",
        avatarUrl: creator.avatarUrl,
      }}
      items={items}
    />
  );
}

