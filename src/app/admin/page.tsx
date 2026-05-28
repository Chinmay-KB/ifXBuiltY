"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

type StyleDna = {
  tone?: string[];
  colors?: string[];
  visual_traits?: string[];
  ux_traits?: string[];
};

type Archetype = {
  type?: string;
  sections?: string[];
  layout?: string;
  content_style?: string[];
};

type Company = {
  id: string;
  name: string;
  styleDna: StyleDna;
  archetype: Archetype;
  logoPath: string | null;
  screenshotCount: number;
  profileType: string;
  parentCompanyId: string | null;
  category: string;
  researchStatus: string;
  popularityTier: number;
  memeStrength: number;
};

type Status = "loading" | "error" | "success";

export default function AdminCompanyListPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "company" | "product">("all");

  const fetchCompanies = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/companies");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? `Failed to load companies (${res.status})`,
        );
      }
      const data: Company[] = await res.json();
      setCompanies(data);
      setStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not load company data",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCompanies();
  }, [fetchCompanies]);

  async function handleDelete(company: Company) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${company.name}"? This will also remove all associated screenshots and logos.`,
    );
    if (!confirmed) return;

    setDeletingId(company.id);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete company");
      }
      // Optimistic removal from local state
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to delete company",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = typeFilter === "all"
    ? companies
    : companies.filter((c) => c.profileType === typeFilter);

  const typeCounts = companies.reduce((acc, c) => {
    acc[c.profileType] = (acc[c.profileType] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">Companies</h2>
        <Link href="/admin/companies/new">
          <Button variant="ink" size="sm">
            + Add Company
          </Button>
        </Link>
      </div>

      {/* Type filter tabs */}
      <div className="mb-4 flex gap-2">
        {[
          { key: "all" as const, label: `All (${companies.length})` },
          { key: "company" as const, label: `Companies (${typeCounts.company ?? 0})` },
          { key: "product" as const, label: `Products (${typeCounts.product ?? 0})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              typeFilter === key
                ? "bg-ink text-chrome"
                : "bg-panel text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <Surface className="p-8 text-center">
          <p className="text-muted">Loading companies…</p>
        </Surface>
      )}

      {/* Error state */}
      {status === "error" && (
        <Surface className="p-8 text-center">
          <p className="text-red-600">{errorMessage}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={fetchCompanies}
          >
            Retry
          </Button>
        </Surface>
      )}

      {/* Empty state */}
      {status === "success" && filtered.length === 0 && (
        <Surface className="p-8 text-center">
          <p className="text-muted">
            {typeFilter === "all"
              ? "No companies exist yet. Add your first company to get started."
              : `No ${typeFilter} profiles found.`}
          </p>
        </Surface>
      )}

      {/* Company list */}
      {status === "success" && filtered.length > 0 && (
        <Surface className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3">Tone</th>
                  <th className="px-4 py-3">Layout</th>
                  <th className="px-4 py-3 text-center">Screenshots</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((company) => (
                  <tr
                    key={company.id}
                    className="transition-colors hover:bg-canvas/60"
                  >
                    {/* Name + logo thumbnail */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <LogoThumbnail
                          name={company.name}
                          logoPath={company.logoPath}
                        />
                        <span className="font-medium text-ink">
                          {company.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-canvas px-1.5 py-0.5 text-xs text-muted">
                        {company.id}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          company.profileType === "product"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {company.profileType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {company.parentCompanyId || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {(company.styleDna.tone ?? []).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {company.archetype.layout || "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-muted">
                      {company.screenshotCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {company.profileType === "product" ? (
                          <Link href={`/admin/products/${company.id}`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/admin/companies/${company.id}`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(company)}
                          disabled={deletingId === company.id}
                        >
                          {deletingId === company.id
                            ? "Deleting…"
                            : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}
    </div>
  );
}

/**
 * Displays a small logo thumbnail or a fallback with the first letter of the company name.
 */
function LogoThumbnail({
  name,
  logoPath,
}: {
  name: string;
  logoPath: string | null;
}) {
  // For now, show a placeholder with the first letter.
  // Signed URLs for private bucket logos would require an additional API call.
  const initial = name.charAt(0).toUpperCase();

  if (logoPath) {
    // We could fetch a signed URL here, but for the list view a simple initial is fine.
    // The detail page will show the actual logo preview.
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink/10 text-xs font-bold text-ink">
        {initial}
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink/10 text-xs font-bold text-muted">
      {initial}
    </div>
  );
}
