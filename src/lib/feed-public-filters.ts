type PublicFeedFilterQuery = {
  eq: (column: string, value: string | boolean) => PublicFeedFilterQuery;
};

/**
 * Restricts a Supabase query to generations safe for public feeds and media URLs
 * (published, visible, completed, and image verified in storage).
 */
export function applyPublicFeedFilters<T extends PublicFeedFilterQuery>(
  query: T,
): T {
  return query
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .eq("status", "completed")
    .eq("image_ready", true) as T;
}
