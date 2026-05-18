import { NextResponse } from "next/server";
import sharp from "sharp";

import { getGenerationImagesBucket } from "@/lib/env-server";
import type { GenerationMediaVariant } from "@/lib/generation-media-url";
import { guessImageMimeFromPath } from "@/lib/image-mime";
import { getPublishedImagePathBySlug } from "@/lib/public-generation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const CACHE_CONTROL =
  "public, max-age=31536000, s-maxage=31536000, immutable";

const VARIANT_WIDTH_PX: Record<Exclude<GenerationMediaVariant, "full">, number> =
  {
    card: 560,
    detail: 1280,
    og: 1200,
  };

function parseVariant(raw: string | null): GenerationMediaVariant | null {
  if (raw === "card" || raw === "detail" || raw === "full" || raw === "og") return raw;
  return null;
}

export async function GET(request: Request, context: RouteContext) {
  const { id: rawSlug } = await context.params;
  const slug = decodeURIComponent(rawSlug).trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const variant = parseVariant(new URL(request.url).searchParams.get("variant"));
  if (!variant) {
    return NextResponse.json(
      { error: "Invalid or missing variant (card | detail | full)" },
      { status: 400 },
    );
  }

  const imagePath = await getPublishedImagePathBySlug(slug);
  if (!imagePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const bucket = getGenerationImagesBucket();
  const { data: blob, error: dlErr } = await supabase.storage
    .from(bucket)
    .download(imagePath);

  if (dlErr || !blob) {
    return NextResponse.json(
      { error: "Could not load image" },
      { status: 502 },
    );
  }

  const buf = Buffer.from(await blob.arrayBuffer());
  const fallbackMime =
    blob.type && blob.type.length > 0
      ? blob.type
      : guessImageMimeFromPath(imagePath);

  if (variant === "full") {
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": fallbackMime,
        "Cache-Control": CACHE_CONTROL,
      },
    });
  }

  const width = VARIANT_WIDTH_PX[variant];

  try {
    const pipeline = sharp(buf).rotate().resize({
      width,
      withoutEnlargement: true,
    });

    // OG variant: serve as JPEG for maximum crawler compatibility
    if (variant === "og") {
      const out = await pipeline.jpeg({ quality: 80 }).toBuffer();
      return new NextResponse(new Uint8Array(out), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": CACHE_CONTROL,
        },
      });
    }

    const out = await pipeline.webp({ quality: 82 }).toBuffer();

    return new NextResponse(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch {
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": fallbackMime,
        "Cache-Control": CACHE_CONTROL,
      },
    });
  }
}
