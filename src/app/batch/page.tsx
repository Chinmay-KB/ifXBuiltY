import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BatchGenerator } from "@/components/batch-generator";
import { SiteHeader } from "@/components/site-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Batch generate",
  robots: { index: false, follow: false },
};

export default async function BatchPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/batch")}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <SiteHeader user={user} active="batch" />
      <main className="flex flex-1 flex-col px-4 py-8 sm:px-12 sm:py-10">
        <BatchGenerator />
      </main>
    </div>
  );
}
