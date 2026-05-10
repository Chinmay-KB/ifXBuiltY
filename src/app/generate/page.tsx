import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { GeneratePageClient } from "./generate-page-client";

export const metadata: Metadata = {
  title: "Generate a parody screenshot",
  description:
    "Pick a builder, pick a target product, and generate a satirical UI screenshot in seconds.",
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

  return (
    <GeneratePageClient
      signedIn={!!user}
      initialBuilder={params.builder}
      initialTarget={params.target}
    />
  );
}
