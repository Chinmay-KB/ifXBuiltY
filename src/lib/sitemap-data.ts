import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPublishedGenerationsForSitemap(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .select("slug, updated_at")
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .eq("status", "completed")
    .eq("image_ready", true)
    .order("updated_at", { ascending: false })
    .limit(50_000);

  if (error || !data) return [];

  return data.map((row) => ({
    slug: row.slug,
    updatedAt: new Date(row.updated_at),
  }));
}

/** Creators with at least one published generation (for public profile URLs). */
export async function getPublicCreatorsForSitemap(): Promise<
  { id: string; updatedAt: Date }[]
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .select("creator_id, updated_at")
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .eq("status", "completed")
    .eq("image_ready", true)
    .order("updated_at", { ascending: false })
    .limit(50_000);

  if (error || !data) return [];

  const byCreator = new Map<string, Date>();
  for (const row of data) {
    const creatorId = row.creator_id as string;
    const updatedAt = new Date(row.updated_at);
    const prev = byCreator.get(creatorId);
    if (!prev || updatedAt > prev) {
      byCreator.set(creatorId, updatedAt);
    }
  }

  return [...byCreator.entries()].map(([id, updatedAt]) => ({
    id,
    updatedAt,
  }));
}
