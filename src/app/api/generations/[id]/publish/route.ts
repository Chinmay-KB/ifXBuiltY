import { NextResponse } from "next/server";
import sharp from "sharp";

import { parseGenerationIdParam } from "@/lib/parse-generation-id";
import { getGenerationImagesBucket } from "@/lib/env-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function variantObjectPath(
  originalPath: string,
  variant: "card" | "detail" | "og",
): string {
  // Keep it deterministic and co-located with the original object.
  // Example: `foo/bar.png.detail.webp`
  if (variant === "og") return `${originalPath}.og.jpg`;
  return `${originalPath}.${variant}.webp`;
}

async function ensurePublishVariants(opts: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  originalPath: string;
}) {
  const { supabase, originalPath } = opts;
  const bucket = getGenerationImagesBucket();

  const { data: blob, error: dlErr } = await supabase.storage
    .from(bucket)
    .download(originalPath);
  if (dlErr || !blob) throw new Error("Could not download original image");

  const input = Buffer.from(await blob.arrayBuffer());
  const base = sharp(input).rotate();

  const card = await base
    .clone()
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const detail = await base
    .clone()
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const og = await base
    .clone()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const uploads: Array<Promise<{ error: unknown }>> = [
    supabase.storage.from(bucket).upload(variantObjectPath(originalPath, "card"), card, {
      upsert: true,
      contentType: "image/webp",
    }),
    supabase.storage.from(bucket).upload(variantObjectPath(originalPath, "detail"), detail, {
      upsert: true,
      contentType: "image/webp",
    }),
    supabase.storage.from(bucket).upload(variantObjectPath(originalPath, "og"), og, {
      upsert: true,
      contentType: "image/jpeg",
    }),
  ];

  const results = await Promise.all(uploads);
  for (const r of results) {
    if ((r as { error?: unknown }).error) {
      throw new Error("Could not upload one or more variants");
    }
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const { id: idStr } = await context.params;
  const id = parseGenerationIdParam(idStr);
  if (id == null) {
    return NextResponse.json({ error: "Invalid generation id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error: selErr } = await supabase
    .from("generations")
    .select("id, slug, visibility, image_path, creator_id")
    .eq("id", id)
    .maybeSingle();

  if (selErr || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (row.visibility === "published") {
    return NextResponse.json({
      ok: true,
      id,
      slug: row.slug,
      visibility: "published" as const,
    });
  }

  if (!row.image_path?.trim()) {
    return NextResponse.json(
      { error: "Cannot publish without an image", code: "missing_image" },
      { status: 400 },
    );
  }

  try {
    await ensurePublishVariants({
      supabase,
      originalPath: row.image_path.trim(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not publish (variant generation failed)" },
      { status: 500 },
    );
  }

  const { error: upErr } = await supabase
    .from("generations")
    .update({ visibility: "published" })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (upErr) {
    return NextResponse.json(
      { error: "Could not publish", detail: upErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    id,
    slug: row.slug,
    visibility: "published" as const,
  });
}
