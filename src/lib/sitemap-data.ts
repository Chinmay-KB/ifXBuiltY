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
    .order("updated_at", { ascending: false })
    .limit(50_000);

  if (error || !data) return [];

  return data.map((row) => ({
    slug: row.slug,
    updatedAt: new Date(row.updated_at),
  }));
}
