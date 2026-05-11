import { ImageResponse } from "next/og";
import sharp from "sharp";

import { getGenerationImagesBucket } from "@/lib/env-server";
import { getPublishedGenerationBySlug } from "@/lib/public-generation";
import { getPublishedImagePathBySlug } from "@/lib/public-generation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  // Fetch the actual image from Supabase storage
  const supabase = await createSupabaseServerClient();
  const bucket = getGenerationImagesBucket();
  const { data: blob, error } = await supabase.storage
    .from(bucket)
    .download(imagePath);

  if (error || !blob) {
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

  // Resize to 1200px and convert to JPEG for maximum crawler compatibility
  const buf = Buffer.from(await blob.arrayBuffer());
  const jpeg = await sharp(buf)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, stale-while-revalidate=86400",
    },
  });
}
