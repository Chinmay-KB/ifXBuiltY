import { NextResponse } from "next/server";

import { generationImageUrl } from "@/lib/generation-media-url";
import { getPublishedImagePathBySlug } from "@/lib/public-generation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Stable same-origin URL for showcase / embeds: redirects to the public CDN
 * detail variant (WebP, bounded width) instead of a short-lived signed Storage URL.
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

  const dest = generationImageUrl(imagePath, "detail");
  if (!dest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(dest, 307);
}
