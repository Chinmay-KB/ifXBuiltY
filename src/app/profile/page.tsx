import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfilePageClient } from "./profile-page-client";

export const metadata: Metadata = {
  title: "My Profile",
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const profile = {
    id: user.id,
    email: user.email ?? undefined,
    avatar_url: user.user_metadata?.avatar_url ?? undefined,
    display_name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      undefined,
    created_at: user.created_at,
  };

  return <ProfilePageClient user={profile} />;
}
