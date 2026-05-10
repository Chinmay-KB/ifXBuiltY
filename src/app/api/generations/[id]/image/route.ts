import { NextResponse } from "next/server";

import { generationMediaPath } from "@/lib/generation-media-url";
import { getPublishedImagePathBySlug } from "@/lib/public-generation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Stable same-origin URL for showcase / embeds: redirects to the cached media
 * endpoint (WebP, bounded width) instead of a short-lived signed Storage URL.
 *
 * Param name is `id` (Next.js requires one dynamic segment name under `generations/[id]/`);
 * value is the published generation **slug**.
 */
export async function GET(request: Request, context: RouteContext) {
  const { id: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug).trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  if (!(await getPublishedImagePathBySlug(slug))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dest = new URL(generationMediaPath(slug, "detail"), request.url);
  return NextResponse.redirect(dest, 307);
}
