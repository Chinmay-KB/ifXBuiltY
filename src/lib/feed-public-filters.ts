export type PublicFeedFilterQuery = {
  eq: (column: string, value: string | boolean) => PublicFeedFilterQuery;
};

type PublicFeedQueryResult = {
  data: unknown;
  error: { message: string } | null;
  count?: number | null;
};

type GenerationsSelectOptions = {
  count?: "exact";
  head?: boolean;
};

/** Minimal Supabase surface — avoids deep Postgrest generic instantiation. */
export type GenerationsSelectClient = {
  from: (table: "generations") => {
    select: (
      columns: string,
      options?: GenerationsSelectOptions,
    ) => PublicFeedFilterQuery;
  };
};

/** Chainable query shape used by public feed callers (avoids deep Supabase generics). */
export type PublicFeedQueryable = PublicFeedFilterQuery & {
  range: (from: number, to: number) => PublicFeedQueryable;
  in: (column: string, values: string[]) => PublicFeedQueryable;
  overlaps: (column: string, values: string[]) => PublicFeedQueryable;
  order: (
    column: string,
    options: { ascending: boolean },
  ) => PublicFeedQueryable;
  gte: (column: string, value: string) => PromiseLike<PublicFeedQueryResult>;
  like: (column: string, pattern: string) => PublicFeedQueryable;
  limit: (count: number) => PublicFeedQueryable;
} & PromiseLike<PublicFeedQueryResult>;

/**
 * Restricts a Supabase query to generations safe for public feeds and media URLs
 * (published, visible, completed, and image verified in storage).
 */
export function applyPublicFeedFilters(
  query: PublicFeedFilterQuery,
): PublicFeedQueryable {
  return query
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .eq("status", "completed")
    .eq("image_ready", true) as PublicFeedQueryable;
}

/** Starts a filtered `generations` select without triggering deep Supabase types. */
export function publicGenerationsQuery(
  supabase: GenerationsSelectClient,
  columns: string,
  options?: GenerationsSelectOptions,
): PublicFeedQueryable {
  return applyPublicFeedFilters(
    supabase.from("generations").select(columns, options),
  );
}
