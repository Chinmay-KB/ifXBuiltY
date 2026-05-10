"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CompanyForm } from "@/components/admin/company-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button, Surface } from "@/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StyleDna = {
  tone?: string[];
  colors?: string[];
  visual_traits?: string[];
  ux_traits?: string[];
  meme_exaggeration?: string[];
  iconic_elements?: string[];
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
};

type Screenshot = {
  id: number;
  company_id: string;
  image_path: string;
  sort_order: number;
  created_at: string;
  signedUrl: string | null;
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  // Company data
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form
  const [formKey, setFormKey] = useState(0);

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [showDeleteLogo, setShowDeleteLogo] = useState(false);

  // Screenshots
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [deletingScreenshotId, setDeletingScreenshotId] = useState<number | null>(null);
  const [showDeleteScreenshot, setShowDeleteScreenshot] = useState<Screenshot | null>(null);

  // -------------------------------------------------------------------------
  // Fetch company data
  // -------------------------------------------------------------------------

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/companies");
      if (!res.ok) throw new Error("Failed to load company data");
      const companies: Company[] = await res.json();
      const found = companies.find((c) => c.id === companyId);
      if (!found) {
        setError("Company not found");
        return;
      }
      setCompany(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company");
    }
  }, [companyId]);

  const fetchScreenshots = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/screenshots`);
      if (!res.ok) throw new Error("Failed to load screenshots");
      const data: Screenshot[] = await res.json();
      setScreenshots(data);
    } catch {
      setScreenshotError("Failed to load screenshots");
    }
  }, [companyId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchCompany();
      await fetchScreenshots();
      setLoading(false);
    }
    init();
  }, [fetchCompany, fetchScreenshots]);

  // -------------------------------------------------------------------------
  // Profile edit success handler
  // -------------------------------------------------------------------------

  async function handleProfileSuccess() {
    // Refresh company data after successful edit, then re-mount the form
    await fetchCompany();
    setFormKey((k) => k + 1);
  }

  // -------------------------------------------------------------------------
  // Logo handlers
  // -------------------------------------------------------------------------

  async function handleLogoUpload(file: File) {
    setLogoError(null);
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/admin/companies/${companyId}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to upload logo");
      }

      const data = await res.json();
      setLogoUrl(data.signedUrl);
      setCompany((prev) => (prev ? { ...prev, logoPath: data.logoPath } : prev));
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Upload failed");
      throw err;
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleLogoDelete() {
    setLogoError(null);
    setLogoDeleting(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/logo`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete logo");
      }

      setLogoUrl(null);
      setCompany((prev) => (prev ? { ...prev, logoPath: null } : prev));
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLogoDeleting(false);
      setShowDeleteLogo(false);
    }
  }

  // -------------------------------------------------------------------------
  // Screenshot handlers
  // -------------------------------------------------------------------------

  async function handleScreenshotUpload(file: File) {
    setScreenshotError(null);
    setScreenshotUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/admin/companies/${companyId}/screenshots`,
        { method: "POST", body: formData },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to upload screenshot");
      }

      // Refresh screenshots list to get signed URLs
      await fetchScreenshots();
    } catch (err) {
      setScreenshotError(err instanceof Error ? err.message : "Upload failed");
      throw err;
    } finally {
      setScreenshotUploading(false);
    }
  }

  async function handleScreenshotDelete(screenshot: Screenshot) {
    setScreenshotError(null);
    setDeletingScreenshotId(screenshot.id);
    try {
      const res = await fetch(
        `/api/admin/companies/${companyId}/screenshots/${screenshot.id}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete screenshot");
      }

      setScreenshots((prev) => prev.filter((s) => s.id !== screenshot.id));
    } catch (err) {
      setScreenshotError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingScreenshotId(null);
      setShowDeleteScreenshot(null);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <Surface className="p-8 text-center">
        <p className="text-muted">Loading company…</p>
      </Surface>
    );
  }

  if (error || !company) {
    return (
      <Surface className="p-8 text-center">
        <p className="text-red-600">{error ?? "Company not found"}</p>
        <Link href="/admin" className="mt-4 inline-block text-sm text-muted hover:text-ink">
          ← Back to companies
        </Link>
      </Surface>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/admin" className="hover:text-ink">
          Companies
        </Link>
        <span>/</span>
        <span className="text-ink font-medium">{company.name}</span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section: Profile Edit */}
      {/* ----------------------------------------------------------------- */}
      <Surface className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">Profile</h3>
        <CompanyForm
          key={formKey}
          mode="edit"
          initialValues={{
            id: company.id,
            name: company.name,
            styleDna: {
              tone: (company.styleDna.tone ?? []).join(", "),
              colors: (company.styleDna.colors ?? []).join(", "),
              visual_traits: (company.styleDna.visual_traits ?? []).join(", "),
              ux_traits: (company.styleDna.ux_traits ?? []).join(", "),
              meme_exaggeration: (company.styleDna.meme_exaggeration ?? []).join(", "),
              iconic_elements: (company.styleDna.iconic_elements ?? []).join(", "),
            },
            archetype: {
              type: company.archetype.type ?? "",
              sections: (company.archetype.sections ?? []).join(", "),
              layout: company.archetype.layout ?? "",
              content_style: (company.archetype.content_style ?? []).join(", "),
            },
          }}
          onSuccess={handleProfileSuccess}
        />
      </Surface>

      {/* ----------------------------------------------------------------- */}
      {/* Section: Logo */}
      {/* ----------------------------------------------------------------- */}
      <Surface className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">Logo</h3>

        <div className="flex items-start gap-6">
          {/* Logo preview */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-line-strong bg-panel">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${company.name} logo`}
                className="h-full w-full rounded-lg object-contain"
              />
            ) : company.logoPath ? (
              <span className="text-2xl font-bold text-muted">
                {company.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <span className="text-xs text-muted">No logo</span>
            )}
          </div>

          {/* Upload / Delete controls */}
          <div className="flex flex-col gap-3">
            <ImageUploader
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              maxSize={2_097_152}
              onUpload={handleLogoUpload}
              label={company.logoPath ? "Replace Logo" : "Upload Logo"}
              loading={logoUploading}
            />

            {company.logoPath && (
              <Button
                variant="ghost"
                size="sm"
                className="w-fit text-red-600 hover:text-red-700"
                onClick={() => setShowDeleteLogo(true)}
                disabled={logoDeleting}
              >
                {logoDeleting ? "Deleting…" : "Delete Logo"}
              </Button>
            )}

            {logoError && <p className="text-xs text-red-600">{logoError}</p>}
          </div>
        </div>
      </Surface>

      {/* ----------------------------------------------------------------- */}
      {/* Section: Screenshots */}
      {/* ----------------------------------------------------------------- */}
      <Surface className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">Screenshots</h3>
          <span className="text-sm text-muted">
            {screenshots.length}/10
          </span>
        </div>

        {/* Screenshot grid */}
        {screenshots.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {screenshots.map((screenshot) => (
              <div
                key={screenshot.id}
                className="group relative overflow-hidden rounded-lg border border-line bg-panel"
              >
                {screenshot.signedUrl ? (
                  <img
                    src={screenshot.signedUrl}
                    alt={`Screenshot ${screenshot.sort_order + 1}`}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-panel">
                    <span className="text-xs text-muted">No preview</span>
                  </div>
                )}

                {/* Delete button overlay */}
                <button
                  type="button"
                  onClick={() => setShowDeleteScreenshot(screenshot)}
                  disabled={deletingScreenshotId === screenshot.id}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50"
                  aria-label={`Delete screenshot ${screenshot.sort_order + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {screenshots.length === 0 && (
          <p className="mb-4 text-sm text-muted">
            No screenshots uploaded yet.
          </p>
        )}

        {/* Upload control */}
        {screenshots.length < 10 && (
          <ImageUploader
            accept="image/png,image/jpeg,image/webp"
            maxSize={5_242_880}
            onUpload={handleScreenshotUpload}
            label="Upload Screenshot"
            loading={screenshotUploading}
          />
        )}

        {screenshots.length >= 10 && (
          <p className="text-xs text-muted">
            Maximum of 10 screenshots reached.
          </p>
        )}

        {screenshotError && (
          <p className="mt-2 text-xs text-red-600">{screenshotError}</p>
        )}
      </Surface>

      {/* ----------------------------------------------------------------- */}
      {/* Confirm Dialogs */}
      {/* ----------------------------------------------------------------- */}
      <ConfirmDialog
        open={showDeleteLogo}
        title="Delete Logo"
        message={`Are you sure you want to delete the logo for "${company.name}"?`}
        confirmLabel="Delete Logo"
        onConfirm={handleLogoDelete}
        onCancel={() => setShowDeleteLogo(false)}
        loading={logoDeleting}
      />

      <ConfirmDialog
        open={showDeleteScreenshot !== null}
        title="Delete Screenshot"
        message={`Are you sure you want to delete this screenshot from "${company.name}"?`}
        confirmLabel="Delete Screenshot"
        onConfirm={() => {
          if (showDeleteScreenshot) handleScreenshotDelete(showDeleteScreenshot);
        }}
        onCancel={() => setShowDeleteScreenshot(null)}
        loading={deletingScreenshotId !== null}
      />
    </div>
  );
}
