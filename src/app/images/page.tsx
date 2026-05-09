import { ImageGenerator } from "@/components/image-generator";
import { SiteHeader } from "@/components/site-header";
import { SHOWCASE_EXAMPLES } from "@/data/showcase-examples";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ImagesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <SiteHeader user={user} active="images" />
      <main className="flex flex-1 flex-col px-4 py-8 sm:px-12 sm:py-10">
        <ImageGenerator signedIn={!!user} showcaseExamples={SHOWCASE_EXAMPLES} />
      </main>
    </div>
  );
}

