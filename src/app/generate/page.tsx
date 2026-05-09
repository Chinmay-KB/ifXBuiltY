import { createSupabaseServerClient } from "@/lib/supabase/server";

import { GeneratePageClient } from "./generate-page-client";

export default async function GeneratePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <GeneratePageClient signedIn={!!user} />;
}
