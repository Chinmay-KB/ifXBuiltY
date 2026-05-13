import { createSupabaseServerClient } from "@/lib/supabase/server";

type FeedFilterOptions = {
  builders: string[];
  targets: string[];
};

type GenerationFilterRow = {
  builder: string | null;
  target: string | null;
};

const MAX_OPTION_ROWS = 5000;

function addTrimmed(set: Set<string>, value: string | null | undefined) {
  const trimmed = value?.trim();
  if (trimmed) set.add(trimmed);
}

function sortOptions(options: Iterable<string>): string[] {
  return Array.from(options).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

/**
 * Fetch filter dropdown options from the full published feed, not just the
 * currently-rendered page of cards.
 */
export async function getFeedFilterOptions(): Promise<FeedFilterOptions> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("generations")
    .select("builder, target")
    .eq("visibility", "published")
    .eq("moderation_status", "visible")
    .range(0, MAX_OPTION_ROWS - 1);

  if (error) {
    console.error("Could not load feed filter options", error);
    return { builders: [], targets: [] };
  }

  const builders = new Set<string>();
  const targets = new Set<string>();

  for (const row of (data ?? []) as GenerationFilterRow[]) {
    addTrimmed(builders, row.builder);
    addTrimmed(targets, row.target);
  }

  return {
    builders: sortOptions(builders),
    targets: sortOptions(targets),
  };
}
