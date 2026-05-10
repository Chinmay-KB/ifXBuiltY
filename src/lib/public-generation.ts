import { generationMediaPath } from "@/lib/generation-media-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicGeneration = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  tone: string;
  screenType: string;
  region: string;
  extraDetails: string;
  /** Optimized WebP for on-page display (~1280px wide max). */
  imageUrl: string | null;
  /** Original bytes from storage (large download / save-as). */
  imageDownloadUrl: string | null;
  upvoteCount: number;
  downvoteCount: number;
  remixCount: number;
};

/** Storage object path for a published, visible generation (media route auth gate). */
export async function getPublishedImagePathBySlug(
  slug: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .select("image_path")
    .eq("slug", slug)
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .maybeSingle();

  if (error || !data?.image_path?.trim()) return null;
  return data.image_path.trim();
}

export async function getPublishedGenerationBySlug(
  slug: string,
): Promise<PublicGeneration | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .select(
      "id, slug, builder, target, tone, screen_type, region, extra_details, image_path, upvote_count, downvote_count, remix_count",
    )
    .eq("slug", slug)
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .maybeSingle();

  if (error || !data) return null;

  const path = data.image_path?.trim();
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
    imageUrl,
    imageDownloadUrl,
    upvoteCount: data.upvote_count,
    downvoteCount: data.downvote_count,
    remixCount: data.remix_count,
  };
}
