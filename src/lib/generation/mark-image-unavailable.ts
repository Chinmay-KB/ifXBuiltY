import { createSupabaseServiceClient } from "@/lib/supabase/service";

/** Clears feed visibility when storage has no object for a completed generation. */
export async function markGenerationImageUnavailable(slug: string): Promise<void> {
  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("generations")
    .update({ image_ready: false })
    .eq("slug", slug.trim())
    .eq("status", "completed");

  if (error) {
    console.error("[generation] mark image unavailable failed", slug, error.message);
  }
}
