import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { isSuperadmin } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin Panel",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  if (!isSuperadmin(user.email)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-ink">Access Denied</h1>
          <p className="mt-2 text-muted">
            You don&apos;t have permission to view this page.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/90"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
