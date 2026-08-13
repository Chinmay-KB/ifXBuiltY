"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button, Surface } from "@/components/ui";

type StyleDna = {
  tone?: string[];
  colors?: string[];
  visual_traits?: string[];
  ux_traits?: string[];
  meme_exaggeration?: string[];
  iconic_elements?: string[];
  behavioral_stereotypes?: string[];
  satirical_patterns?: string[];
};

type Archetype = {
  type?: string;
  sections?: string[];
  layout?: string;
  content_style?: string[];
};

type Product = {
  id: string;
  name: string;
  parentCompanyId: string | null;
  category: string;
  popularityTier: number;
  researchStatus: string;
  memeStrength: number;
  sourceUrls: string[];
  styleDna: StyleDna;
  archetype: Archetype;
  defaultVibeTags: string[];
};

function dnaArrayToText(arr: string[] | undefined): string {
  return (arr ?? []).join(", ");
}

function textToDnaArray(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [parentCompanyId, setParentCompanyId] = useState("");
  const [category, setCategory] = useState("");
  const [popularityTier, setPopularityTier] = useState(2);
  const [memeStrength, setMemeStrength] = useState(3);
  const [tone, setTone] = useState("");
  const [colors, setColors] = useState("");
  const [visualTraits, setVisualTraits] = useState("");
  const [uxTraits, setUxTraits] = useState("");
  const [memeExaggeration, setMemeExaggeration] = useState("");
  const [iconicElements, setIconicElements] = useState("");
  const [behavioralStereotypes, setBehavioralStereotypes] = useState("");
  const [satiricalPatterns, setSatiricalPatterns] = useState("");
  const [archetypeType, setArchetypeType] = useState("");
  const [archetypeSections, setArchetypeSections] = useState("");
  const [archetypeLayout, setArchetypeLayout] = useState("");
  const [archetypeContentStyle, setArchetypeContentStyle] = useState("");
  const [sourceUrls, setSourceUrls] = useState("");
  const [defaultVibeTags, setDefaultVibeTags] = useState("");

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) throw new Error("Failed to load product data");
      const data: Product = await res.json();
      setProduct(data);
      setName(data.name);
      setParentCompanyId(data.parentCompanyId ?? "");
      setCategory(data.category);
      setPopularityTier(data.popularityTier);
      setMemeStrength(data.memeStrength);
      setTone(dnaArrayToText(data.styleDna.tone));
      setColors(dnaArrayToText(data.styleDna.colors));
      setVisualTraits(dnaArrayToText(data.styleDna.visual_traits));
      setUxTraits(dnaArrayToText(data.styleDna.ux_traits));
      setMemeExaggeration(dnaArrayToText(data.styleDna.meme_exaggeration));
      setIconicElements(dnaArrayToText(data.styleDna.iconic_elements));
      setBehavioralStereotypes(dnaArrayToText(data.styleDna.behavioral_stereotypes));
      setSatiricalPatterns(dnaArrayToText(data.styleDna.satirical_patterns));
      setArchetypeType(data.archetype.type ?? "");
      setArchetypeSections(dnaArrayToText(data.archetype.sections));
      setArchetypeLayout(data.archetype.layout ?? "");
      setArchetypeContentStyle(dnaArrayToText(data.archetype.content_style));
      setSourceUrls((data.sourceUrls ?? []).join("\n"));
      setDefaultVibeTags((data.defaultVibeTags ?? []).join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProduct();
  }, [fetchProduct]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          parentCompanyId: parentCompanyId || null,
          category,
          popularityTier,
          memeStrength,
          styleDna: {
            tone: textToDnaArray(tone),
            colors: textToDnaArray(colors),
            visual_traits: textToDnaArray(visualTraits),
            ux_traits: textToDnaArray(uxTraits),
            meme_exaggeration: textToDnaArray(memeExaggeration),
            iconic_elements: textToDnaArray(iconicElements),
            behavioral_stereotypes: textToDnaArray(behavioralStereotypes),
            satirical_patterns: textToDnaArray(satiricalPatterns),
          },
          archetype: {
            type: archetypeType,
            sections: textToDnaArray(archetypeSections),
            layout: archetypeLayout,
            content_style: textToDnaArray(archetypeContentStyle),
          },
          sourceUrls: sourceUrls
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          defaultVibeTags: textToDnaArray(defaultVibeTags),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save product");
      }

      setSaveSuccess(true);
      await fetchProduct();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          parentCompanyId: parentCompanyId || null,
          category,
          popularityTier,
          memeStrength,
          styleDna: {
            tone: textToDnaArray(tone),
            colors: textToDnaArray(colors),
            visual_traits: textToDnaArray(visualTraits),
            ux_traits: textToDnaArray(uxTraits),
            meme_exaggeration: textToDnaArray(memeExaggeration),
            iconic_elements: textToDnaArray(iconicElements),
            behavioral_stereotypes: textToDnaArray(behavioralStereotypes),
            satirical_patterns: textToDnaArray(satiricalPatterns),
          },
          archetype: {
            type: archetypeType,
            sections: textToDnaArray(archetypeSections),
            layout: archetypeLayout,
            content_style: textToDnaArray(archetypeContentStyle),
          },
          sourceUrls: sourceUrls
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          defaultVibeTags: textToDnaArray(defaultVibeTags),
          researchStatus: "approved",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update product");
      }

      router.push("/admin/products");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!confirm(`Reject "${product?.name}"? This will delete the profile.`)) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to reject product");
      }

      router.push("/admin/products");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Surface className="p-8 text-center">
        <p className="text-muted">Loading product…</p>
      </Surface>
    );
  }

  if (error || !product) {
    return (
      <Surface className="p-8 text-center">
        <p className="text-red-600">{error ?? "Product not found"}</p>
        <Link href="/admin/products" className="mt-4 inline-block text-sm text-muted hover:text-ink">
          ← Back to products
        </Link>
      </Surface>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/admin" className="hover:text-ink">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin/products" className="hover:text-ink">
          Products
        </Link>
        <span>/</span>
        <span className="text-ink font-medium">{product.name}</span>
      </div>

      {/* Status banner */}
      <Surface className={`p-4 ${
        product.researchStatus === "approved"
          ? "border-green-200 bg-green-50"
          : product.researchStatus === "rejected"
            ? "border-red-200 bg-red-50"
            : "border-yellow-200 bg-yellow-50"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">
              Status: <span className="uppercase">{product.researchStatus}</span>
            </p>
            <p className="text-xs text-muted">
              Slug: {product.id} · Parent: {product.parentCompanyId || "none"} · Category: {product.category || "none"}
            </p>
          </div>
          <div className="flex gap-2">
            {product.researchStatus !== "approved" && (
              <Button
                variant="ink"
                size="sm"
                onClick={handleApprove}
                disabled={saving}
              >
                {saving ? "Saving…" : "Approve & Publish"}
              </Button>
            )}
            {product.researchStatus !== "rejected" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={handleReject}
                disabled={saving}
              >
                Reject
              </Button>
            )}
          </div>
        </div>
      </Surface>

      {/* Messages */}
      {saveError && (
        <Surface className="border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{saveError}</p>
        </Surface>
      )}
      {saveSuccess && (
        <Surface className="border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-600">Saved successfully.</p>
        </Surface>
      )}

      {/* Identity */}
      <Surface className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">Identity</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Parent Company ID">
            <input
              type="text"
              value={parentCompanyId}
              onChange={(e) => setParentCompanyId(e.target.value)}
              placeholder="e.g. google, microsoft"
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Category">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. search, video, maps"
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Popularity Tier (1-3)">
              <input
                type="number"
                min={1}
                max={3}
                value={popularityTier}
                onChange={(e) => setPopularityTier(Number(e.target.value))}
                className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
              />
            </Field>
            <Field label="Meme Strength (1-5)">
              <input
                type="number"
                min={1}
                max={5}
                value={memeStrength}
                onChange={(e) => setMemeStrength(Number(e.target.value))}
                className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
              />
            </Field>
          </div>
        </div>
      </Surface>

      {/* Style DNA */}
      <Surface className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">Style DNA</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tone">
            <textarea
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Colors">
            <textarea
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Visual Traits">
            <textarea
              value={visualTraits}
              onChange={(e) => setVisualTraits(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="UX Traits">
            <textarea
              value={uxTraits}
              onChange={(e) => setUxTraits(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Meme Exaggeration">
            <textarea
              value={memeExaggeration}
              onChange={(e) => setMemeExaggeration(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Iconic Elements">
            <textarea
              value={iconicElements}
              onChange={(e) => setIconicElements(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Behavioral Stereotypes">
            <textarea
              value={behavioralStereotypes}
              onChange={(e) => setBehavioralStereotypes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Satirical Patterns">
            <textarea
              value={satiricalPatterns}
              onChange={(e) => setSatiricalPatterns(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
        </div>
      </Surface>

      {/* Archetype */}
      <Surface className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">Archetype</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <input
              type="text"
              value={archetypeType}
              onChange={(e) => setArchetypeType(e.target.value)}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Layout">
            <input
              type="text"
              value={archetypeLayout}
              onChange={(e) => setArchetypeLayout(e.target.value)}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Sections">
            <textarea
              value={archetypeSections}
              onChange={(e) => setArchetypeSections(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
          <Field label="Content Style">
            <textarea
              value={archetypeContentStyle}
              onChange={(e) => setArchetypeContentStyle(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </Field>
        </div>
      </Surface>

      {/* Sources */}
      <Surface className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">Source URLs</h3>
        <Field label="Reference URLs (one per line)">
          <textarea
            value={sourceUrls}
            onChange={(e) => setSourceUrls(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink font-mono"
          />
        </Field>
      </Surface>

      {/* Vibe Tags */}
      <Surface className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">Default Vibe Tags</h3>
        <Field label="Tags (comma-separated)">
          <input
            type="text"
            value={defaultVibeTags}
            onChange={(e) => setDefaultVibeTags(e.target.value)}
            placeholder="e.g. Chaotic, Bureaucratic, Premium"
            className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
        </Field>
      </Surface>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="ink"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        <Link href="/admin/products">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
