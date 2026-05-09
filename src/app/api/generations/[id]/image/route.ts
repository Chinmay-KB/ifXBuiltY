import { NextResponse } from "next/server";

import { getGenerationImagesBucket } from "@/lib/env-server";
import { getPublishedImagePathBySlug } from "@/lib/public-generation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Stable same-origin URL for showcase / embeds: redirects to a freshly signed
 * Supabase Storage URL (short-lived). Each request re-signs — safe for img src.
 *
 * Param name is `id` (Next.js requires one dynamic segment name under `generations/[id]/`);
 * value is the published generation **slug**.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug).trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const imagePath = await getPublishedImagePathBySlug(slug);
  if (!imagePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const service = createSupabaseServiceClient();
    const bucket = getGenerationImagesBucket();
    const { data: signed, error: signErr } = await service.storage
      .from(bucket)
      .createSignedUrl(imagePath, 3600);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json(
        { error: "Could not sign image URL" },
        { status: 502 },
      );
    }

    return NextResponse.redirect(signed.signedUrl, 302);
  } catch {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
}
