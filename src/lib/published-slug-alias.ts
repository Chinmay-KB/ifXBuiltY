import { createPublicFeedClient } from "@/lib/feed-client";
import { publicGenerationsQuery } from "@/lib/feed-public-filters";
import { isNumericSlugAlias } from "@/lib/slug";

/** `/g/{slug}` with a single path segment, or null. */
export function generationDetailSlugFromPathname(
  pathname: string,
): string | null {
  const match = /^\/g\/([^/]+)\/?$/.exec(pathname);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function publishedGenerationPath(slug: string): string {
  return `/g/${encodeURIComponent(slug)}`;
}

/**
 * If `/g/{slug}` is not a public generation, find a published numeric alias
 * (`{slug}-1`) so dead uniqueness-suffix paths can redirect.
 */
export async function findPublishedSlugAlias(
  requested: string,
): Promise<string | null> {
  const trimmed = requested.trim();
  if (!trimmed) return null;

  const supabase = createPublicFeedClient();
  if (!supabase) return null;

  try {
    const { data, error } = await publicGenerationsQuery(supabase, "slug")
      .like("slug", `${trimmed}-%`)
      .limit(50);

    if (error || !data) return null;

    const matches = (data as { slug: unknown }[])
      .map((row) => row.slug)
      .filter((slug): slug is string => typeof slug === "string")
      .filter((slug) => isNumericSlugAlias(trimmed, slug) && slug !== trimmed)
      .sort((a, b) => {
        const aN = Number(a.slice(trimmed.length + 1));
        const bN = Number(b.slice(trimmed.length + 1));
        return aN - bN;
      });

    return matches[0] ?? null;
  } catch {
    return null;
  }
}

async function hasPublishedGenerationSlug(slug: string): Promise<boolean> {
  const trimmed = slug.trim();
  if (!trimmed) return false;

  const supabase = createPublicFeedClient();
  if (!supabase) return false;

  try {
    const { data, error } = await publicGenerationsQuery(supabase, "slug")
      .in("slug", [trimmed])
      .limit(1);

    if (error || !data) return false;

    return (data as { slug: unknown }[]).some(
      (row) => typeof row.slug === "string" && row.slug === trimmed,
    );
  } catch {
    return false;
  }
}

/**
 * Alias to 308 toward when `{slug}` itself is not a published generation.
 * Returns null when the exact slug is live, so `/g/foo` is not sent to `/g/foo-1`.
 */
export async function resolvePublishedSlugAliasRedirect(
  requested: string,
): Promise<string | null> {
  const trimmed = requested.trim();
  if (!trimmed) return null;
  if (await hasPublishedGenerationSlug(trimmed)) return null;
  return findPublishedSlugAlias(trimmed);
}
