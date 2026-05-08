import { getGenerationImagesBucket } from "@/lib/env-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type PublicGeneration = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  tone: string;
  screenType: string;
  region: string;
  extraDetails: string;
  imageUrl: string | null;
  upvoteCount: number;
  downvoteCount: number;
  remixCount: number;
};

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

  let imageUrl: string | null = null;
  const path = data.image_path?.trim();
  if (path) {
    try {
      const service = createSupabaseServiceClient();
      const bucket = getGenerationImagesBucket();
      const { data: signed, error: signErr } = await service.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
      if (!signErr && signed?.signedUrl) imageUrl = signed.signedUrl;
    } catch {
      /* service role unavailable */
    }
  }

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
    upvoteCount: data.upvote_count,
    downvoteCount: data.downvote_count,
    remixCount: data.remix_count,
  };
}
