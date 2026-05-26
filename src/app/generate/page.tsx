import type { Metadata } from "next";

import { getSelectableCompanyGroups } from "@/data/company-profiles";
import { buildGeneratorProfileGroups } from "@/data/generator-profile-options";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { GeneratePageClient } from "./generate-page-client";

export const metadata: Metadata = {
  title: "Generate a cursed AI screenshot",
  description:
    "Pick the culprit brand, pick the product victim, and let ifXBuiltY cook a satirical AI UI screenshot before legal gets a calendar invite.",
  alternates: { canonical: "/generate" },
};

type Props = {
  searchParams: Promise<{ builder?: string; target?: string }>;
};

export default async function GeneratePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const groups = await getSelectableCompanyGroups();
  const profileGroups = buildGeneratorProfileGroups(groups);

  return (
    <GeneratePageClient
      signedIn={!!user}
      initialBuilder={params.builder}
      initialTarget={params.target}
      profileGroups={profileGroups}
    />
  );
}
