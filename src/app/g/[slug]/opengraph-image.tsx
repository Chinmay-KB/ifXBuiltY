import { ImageResponse } from "next/og";

import { generationImageUrl } from "@/lib/generation-media-url";
import { getPublishedGenerationBySlug } from "@/lib/public-generation";
import { getPublishedImagePathBySlug } from "@/lib/public-generation";
import { formatResultTitle } from "@/lib/ui/format";

export const runtime = "nodejs";

export const alt = "Generation preview";
export const size = { width: 1200, height: 1200 };
export const contentType = "image/jpeg";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const imagePath = await getPublishedImagePathBySlug(slug);

  if (!imagePath) {
    // Fallback: render a text-based OG image
    const gen = await getPublishedGenerationBySlug(slug);
    const title = gen
      ? formatResultTitle(gen.builder, gen.target)
      : "ifXBuiltY";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#111",
            color: "#fff",
            fontSize: 64,
            fontWeight: 700,
            padding: "60px",
            textAlign: "center",
          }}
        >
          {title}
        </div>
      ),
      { ...size },
    );
  }

  // The 1200px JPEG OG variant is produced at generation time and lives in the
  // public bucket, so we can fetch it straight from the CDN (no auth, no sharp).
  const ogUrl = generationImageUrl(imagePath, "og");
  const ogResponse = ogUrl ? await fetch(ogUrl).catch(() => null) : null;

  if (!ogResponse || !ogResponse.ok) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#111",
            color: "#fff",
            fontSize: 48,
          }}
        >
          ifXBuiltY
        </div>
      ),
      { ...size },
    );
  }

  return new Response(ogResponse.body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, stale-while-revalidate=86400",
    },
  });
}
