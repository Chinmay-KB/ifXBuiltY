import Link from "next/link";

import { RemixForm } from "@/components/remix-form";
import { SiteHeader } from "@/components/site-header";
import { generationImageUrl } from "@/lib/generation-media-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatResultTitle } from "@/lib/ui/format";
import type { GenerationInputs, RemixSource } from "@/lib/ui/types";

type Props = { params: Promise<{ id: string }> };

export default async function RemixPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Validate the ID is a positive integer
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
    return (
      <div className="flex min-h-full flex-col bg-canvas">
        <SiteHeader user={user} active="generate" />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl text-ink">Source unavailable</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            The source generation could not be found. It may have been removed or is no longer public.
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center justify-center rounded-lg border-2 border-ink bg-chrome px-5 py-3 text-base font-black text-ink hover:brightness-[0.98]"
          >
            Generate from scratch
          </Link>
        </main>
      </div>
    );
  }

  // Fetch the source generation — must be published and visible
  const { data: source, error: fetchErr } = await supabase
    .from("generations")
    .select(
      "id, slug, builder, target, tone, screen_type, region, extra_details, image_path, visibility, moderation_status",
    )
    .eq("id", numericId)
    .maybeSingle();

  // Handle unavailable source generation
  if (
    fetchErr ||
    !source ||
    source.visibility !== "published" ||
    source.moderation_status !== "visible"
  ) {
    return (
      <div className="flex min-h-full flex-col bg-canvas">
        <SiteHeader user={user} active="generate" />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl text-ink">Source unavailable</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            The source generation is no longer available. It may have been unpublished or removed.
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center justify-center rounded-lg border-2 border-ink bg-chrome px-5 py-3 text-base font-black text-ink hover:brightness-[0.98]"
          >
            Generate from scratch
          </Link>
        </main>
      </div>
    );
  }

  const imagePath = source.image_path?.trim();
  const imageUrl = imagePath ? generationImageUrl(imagePath, "card") : null;

  // Build the remix source and initial values
  const remixSource: RemixSource = {
    id: source.id,
    label: formatResultTitle(source.builder, source.target),
    imageUrl,
  };

  const initialValues: Partial<GenerationInputs> = {
    builder: source.builder,
    target: source.target,
    extraDetails: source.extra_details,
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <SiteHeader user={user} active="generate" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          Remix
        </h1>
        <RemixForm
          signedIn={!!user}
          remixSource={remixSource}
          initialValues={initialValues}
        />
      </main>
    </div>
  );
}
