import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { generationImageUrl } from "@/lib/generation-media-url";
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

  const { data: profile } = await service
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.id) {
    return {
      id: profile.id as string,
      displayName:
        typeof profile.display_name === "string" && profile.display_name.trim()
          ? profile.display_name.trim()
          : null,
      avatarUrl:
        typeof profile.avatar_url === "string" && profile.avatar_url.trim()
          ? profile.avatar_url.trim()
          : null,
    };
  }

  const { data, error } = await service.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;

  const meta = data.user.user_metadata as
    | {
        full_name?: unknown;
        name?: unknown;
        preferred_username?: unknown;
        user_name?: unknown;
        avatar_url?: unknown;
        picture?: unknown;
      }
    | null
    | undefined;

  const rawName =
    typeof meta?.full_name === "string"
      ? meta.full_name
      : typeof meta?.name === "string"
        ? meta.name
        : typeof meta?.preferred_username === "string"
          ? meta.preferred_username
          : typeof meta?.user_name === "string"
            ? meta.user_name
        : "";
  const displayName = rawName.trim() || null;

  const rawAvatar =
    (typeof meta?.avatar_url === "string" ? meta.avatar_url : "") ||
    (typeof meta?.picture === "string" ? meta.picture : "");
  const avatarUrl = rawAvatar.trim() || null;

  return { id: data.user.id as string, displayName, avatarUrl };
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

  const items: FeedItem[] = [];
  for (const row of data as GenerationRow[]) {
    const path = row.image_path?.trim();
    const imageUrl = path ? generationImageUrl(path, "card") : null;
    if (!path || !imageUrl) continue;
    items.push({
      id: row.id,
      slug: row.slug,
      builder: row.builder,
      target: row.target,
      imageUrl,
      imagePath: path,
      netScore: row.net_score ?? 0,
      remixCount: row.remix_count ?? 0,
      createdAt: row.created_at,
      screenType: row.screen_type ?? undefined,
    });
  }
  return items;
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

