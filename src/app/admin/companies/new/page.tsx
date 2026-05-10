"use client";

import Link from "next/link";

import { CompanyForm } from "@/components/admin/company-form";

export default function AddCompanyPage() {
  return (
    <div>
      {/* Page header with back link */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-muted transition-colors hover:text-ink"
        >
          ← Back to companies
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-ink">Add Company</h2>
      </div>

      {/* Form */}
      <div className="max-w-lg">
        <CompanyForm mode="create" />
      </div>
    </div>
  );
}
