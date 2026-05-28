import { getAnonSessionId } from "@/lib/anon-session";
import { generationMediaPath } from "@/lib/generation-media-url";
import type { GenerationStatus } from "@/lib/generation/types";
import { isGenerationStatus } from "@/lib/generation/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { cache } from "react";

export type PublicGeneration = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  tone: string;
  screenType: string;
  region: string;
  extraDetails: string;
  status: GenerationStatus;
  errorMessage: string | null;
  /** Optimized WebP for on-page display (~1280px wide max). */
  imageUrl: string | null;
  /** Original bytes from storage (large download / save-as). */
  imageDownloadUrl: string | null;
  upvoteCount: number;
  downvoteCount: number;
  remixCount: number;
  isOwner: boolean;
  /** Current visitor's vote from anon session cookie, if any. */
  userVote: 1 | -1 | null;
};

type GenerationRow = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  tone: string;
  screen_type: string;
  region: string;
  extra_details: string;
  image_path: string | null;
  image_ready: boolean;
  status: string;
  error_message: string | null;
  upvote_count: number;
  downvote_count: number;
  remix_count: number;
  creator_id: string;
  visibility: string;
  moderation_status: string;
};

async function fetchUserVote(
  generationId: number,
  anonSessionId: string | null,
): Promise<1 | -1 | null> {
  if (!anonSessionId) return null;

  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch {
    return null;
  }

  const { data, error } = await service
    .from("votes")
    .select("vote_value")
    .eq("generation_id", generationId)
    .eq("anon_session_id", anonSessionId)
    .maybeSingle();

  if (error || !data) return null;

  const value = data.vote_value;
  if (value === 1 || value === -1) return value;
  return null;
}

function mapRow(
  data: GenerationRow,
  isOwner: boolean,
  userVote: 1 | -1 | null,
): PublicGeneration {
  const status: GenerationStatus = isGenerationStatus(data.status)
    ? data.status
    : "failed";
  const path =
    status === "completed" && data.image_ready
      ? data.image_path?.trim()
      : null;
  const imageUrl = path ? generationMediaPath(data.slug, "detail") : null;
  const imageDownloadUrl = path ? generationMediaPath(data.slug, "full") : null;

  return {
    id: data.id,
    slug: data.slug,
    builder: data.builder,
    target: data.target,
    tone: data.tone,
    screenType: data.screen_type,
    region: data.region,
    extraDetails: data.extra_details,
    status,
    errorMessage: data.error_message,
    imageUrl,
    imageDownloadUrl,
    upvoteCount: data.upvote_count,
    downvoteCount: data.downvote_count,
    remixCount: data.remix_count,
    isOwner,
    userVote,
  };
}

const generationSelect =
  "id, slug, builder, target, tone, screen_type, region, extra_details, image_path, image_ready, status, error_message, upvote_count, downvote_count, remix_count, creator_id, visibility, moderation_status";

/** Storage object path for a completed published generation (media route auth gate). */
export async function getPublishedImagePathBySlug(
  slug: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .select("image_path, status, image_ready")
    .eq("slug", slug)
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .eq("status", "completed")
    .eq("image_ready", true)
    .maybeSingle();

  if (error || !data?.image_path?.trim()) return null;
  return data.image_path.trim();
}

export async function getGenerationBySlug(
  slug: string,
): Promise<PublicGeneration | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("generations")
    .select(generationSelect)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const isOwner = Boolean(user?.id && data.creator_id === user.id);
  const isPublic =
    data.visibility === "published" &&
    data.moderation_status === "visible" &&
    data.status === "completed" &&
    data.image_ready === true;

  if (!isPublic && !isOwner) return null;

  const row = data as GenerationRow;
  const anonSessionId = await getAnonSessionId();
  const userVote = await fetchUserVote(row.id, anonSessionId);

  return mapRow(row, isOwner, userVote);
}

/**
 * Request-scoped memoization so `generateMetadata` + page render
 * don't re-query Supabase for the same slug.
 */
export const getGenerationBySlugCached = cache(getGenerationBySlug);

/** @deprecated Use getGenerationBySlug */
export async function getPublishedGenerationBySlug(
  slug: string,
): Promise<PublicGeneration | null> {
  const gen = await getGenerationBySlug(slug);
  if (!gen || gen.status !== "completed") return null;
  return gen;
}
