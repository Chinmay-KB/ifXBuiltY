import { NextResponse } from "next/server";

import {
  FEED_DEFAULT_LIMIT,
  FEED_MAX_LIMIT,
} from "@/lib/constants";
import { getGenerationImagesBucket } from "@/lib/env-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const SIGNED_URL_TTL_SEC = 3600;

type SortKey = "newest" | "trending";

function parseSort(raw: string | null): SortKey {
  if (raw === "trending") return "trending";
  return "newest";
}

function parseLimit(raw: string | null): number {
  if (raw == null || raw === "") return FEED_DEFAULT_LIMIT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return FEED_DEFAULT_LIMIT;
  return Math.min(Math.floor(n), FEED_MAX_LIMIT);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sort = parseSort(url.searchParams.get("sort"));
  const limit = parseLimit(url.searchParams.get("limit"));

  const supabase = await createSupabaseServerClient();

  let q = supabase
    .from("generations")
    .select(
      "id, slug, builder, target, tone, screen_type, region, extra_details, image_path, upvote_count, downvote_count, net_score, remix_count, created_at",
    )
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .limit(limit);

  if (sort === "trending") {
    q = q
      .order("net_score", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  const { data: rows, error } = await q;

  if (error) {
    return NextResponse.json(
      { error: "Could not load feed", detail: error.message },
      { status: 500 },
    );
  }

  const list = rows ?? [];
  if (list.length === 0) {
    return NextResponse.json({ sort, items: [] });
  }

  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch {
    const items = list.map((r) => ({
      id: r.id,
      slug: r.slug,
      builder: r.builder,
      target: r.target,
      tone: r.tone,
      screenType: r.screen_type,
      region: r.region,
      extraDetails: r.extra_details,
      imageUrl: null as string | null,
      imagePath: r.image_path,
      upvoteCount: r.upvote_count,
      downvoteCount: r.downvote_count,
      netScore: r.net_score,
      remixCount: r.remix_count,
      createdAt: r.created_at,
    }));
    return NextResponse.json({
      sort,
      items,
      warning:
        "Signed image URLs unavailable; configure SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  const bucket = getGenerationImagesBucket();
  const items = await Promise.all(
    list.map(async (r) => {
      let imageUrl: string | null = null;
      if (r.image_path) {
        const { data: signed, error: signErr } = await service.storage
          .from(bucket)
          .createSignedUrl(r.image_path, SIGNED_URL_TTL_SEC);
        if (!signErr && signed?.signedUrl) imageUrl = signed.signedUrl;
      }
      return {
        id: r.id,
        slug: r.slug,
        builder: r.builder,
        target: r.target,
        tone: r.tone,
        screenType: r.screen_type,
        region: r.region,
        extraDetails: r.extra_details,
        imageUrl,
        imagePath: r.image_path,
        upvoteCount: r.upvote_count,
        downvoteCount: r.downvote_count,
        netScore: r.net_score,
        remixCount: r.remix_count,
        createdAt: r.created_at,
      };
    }),
  );

  return NextResponse.json({ sort, items });
}
