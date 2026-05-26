"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";
import { VIBE_TAGS } from "@/lib/vibe-tags";

const SLUG_REGEX = /^[a-z0-9-]+$/;
const MAX_SLUG_LENGTH = 60;

export type ProductStyleDnaValues = {
  tone: string;
  colors: string;
  visual_traits: string;
  ux_traits: string;
  meme_exaggeration: string;
  iconic_elements: string;
  behavioral_stereotypes: string;
  satirical_patterns: string;
};

export type ProductArchetypeValues = {
  type: string;
  sections: string;
  layout: string;
  content_style: string;
};

export type ProductFormValues = {
  id: string;
  name: string;
  parentCompanyId: string;
  category: string;
  popularityTier: number;
  memeStrength: number;
  defaultVibeTags: string[];
  styleDna: ProductStyleDnaValues;
  archetype: ProductArchetypeValues;
};

type ProductFormProps = {
  mode: "create";
  onSuccess?: () => void;
};

type FieldErrors = Record<string, string>;

const EMPTY_STYLE_DNA: ProductStyleDnaValues = {
  tone: "",
  colors: "",
  visual_traits: "",
  ux_traits: "",
  meme_exaggeration: "",
  iconic_elements: "",
  behavioral_stereotypes: "",
  satirical_patterns: "",
};

const EMPTY_ARCHETYPE: ProductArchetypeValues = {
  type: "",
  sections: "",
  layout: "",
  content_style: "",
};

const EMPTY_VALUES: ProductFormValues = {
  id: "",
  name: "",
  parentCompanyId: "",
  category: "",
  popularityTier: 2,
  memeStrength: 3,
  defaultVibeTags: [],
  styleDna: EMPTY_STYLE_DNA,
  archetype: EMPTY_ARCHETYPE,
};

function toArray(s: string): string[] {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function ProductForm({ mode, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(path: string, value: string | number) {
    setValues((prev) => {
      const next = { ...prev };
      if (
        path === "id" ||
        path === "name" ||
        path === "parentCompanyId" ||
        path === "category"
      ) {
        (next as Record<string, unknown>)[path] = value;
      } else if (path === "popularityTier" || path === "memeStrength") {
        (next as Record<string, unknown>)[path] = value;
      } else if (path.startsWith("styleDna.")) {
        const key = path.replace("styleDna.", "") as keyof ProductStyleDnaValues;
        next.styleDna = { ...next.styleDna, [key]: value as string };
      } else if (path.startsWith("archetype.")) {
        const key = path.replace("archetype.", "") as keyof ProductArchetypeValues;
        next.archetype = { ...next.archetype, [key]: value as string };
      }
      return next;
    });
    if (fieldErrors[path]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
    }
    if (serverError) setServerError("");
  }

  function handleVibeTagToggle(tag: string) {
    setValues((prev) => {
      const tags = prev.defaultVibeTags.includes(tag)
        ? prev.defaultVibeTags.filter((t) => t !== tag)
        : [...prev.defaultVibeTags, tag];
      return { ...prev, defaultVibeTags: tags };
    });
    if (serverError) setServerError("");
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    const slug = values.id.trim();
    if (!slug) errors.id = "Slug is required";
    else if (slug.length > MAX_SLUG_LENGTH) errors.id = `Max ${MAX_SLUG_LENGTH} characters`;
    else if (!SLUG_REGEX.test(slug)) errors.id = "Only lowercase letters, numbers, and hyphens";

    if (!values.name.trim()) errors.name = "Name is required";
    else if (values.name.trim().length > 100) errors.name = "Max 100 characters";

    if (values.popularityTier < 1 || values.popularityTier > 3) {
      errors.popularityTier = "Must be 1, 2, or 3";
    }
    if (values.memeStrength < 1 || values.memeStrength > 5) {
      errors.memeStrength = "Must be between 1 and 5";
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setServerError("");

    const payload = {
      id: values.id.trim(),
      name: values.name.trim(),
      parentCompanyId: values.parentCompanyId.trim() || null,
      category: values.category.trim(),
      popularityTier: values.popularityTier,
      memeStrength: values.memeStrength,
      defaultVibeTags: values.defaultVibeTags,
      styleDna: {
        tone: toArray(values.styleDna.tone),
        colors: toArray(values.styleDna.colors),
        visual_traits: toArray(values.styleDna.visual_traits),
        ux_traits: toArray(values.styleDna.ux_traits),
        meme_exaggeration: toArray(values.styleDna.meme_exaggeration),
        iconic_elements: toArray(values.styleDna.iconic_elements),
        behavioral_stereotypes: toArray(values.styleDna.behavioral_stereotypes),
        satirical_patterns: toArray(values.styleDna.satirical_patterns),
      },
      archetype: {
        type: values.archetype.type.trim(),
        sections: toArray(values.archetype.sections),
        layout: values.archetype.layout.trim(),
        content_style: toArray(values.archetype.content_style),
      },
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? `Request failed (${res.status})`;
        if (res.status === 409) {
          setFieldErrors({ id: "A product with this slug already exists" });
        } else {
          setServerError(message);
        }
        return;
      }

      if (mode === "create") {
        router.push(`/admin/products/${values.id.trim()}`);
      } else {
        onSuccess?.();
      }
    } catch {
      setServerError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-base font-semibold text-ink">Identity</legend>

        <Field
          label="Slug (ID)"
          hint="Lowercase letters, numbers, and hyphens. e.g. google-maps"
          value={values.id}
          onChange={(v) => handleChange("id", v)}
          error={fieldErrors.id}
          placeholder="e.g. google-maps"
        />

        <Field
          label="Name"
          value={values.name}
          onChange={(v) => handleChange("name", v)}
          error={fieldErrors.name}
          placeholder="e.g. Google Maps"
        />

        <Field
          label="Parent Company ID"
          hint="Slug of the parent company profile, if any."
          value={values.parentCompanyId}
          onChange={(v) => handleChange("parentCompanyId", v)}
          placeholder="e.g. google"
        />

        <Field
          label="Category"
          value={values.category}
          onChange={(v) => handleChange("category", v)}
          placeholder="e.g. maps, video, search"
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Popularity Tier (1–3)"
            value={String(values.popularityTier)}
            onChange={(v) => handleChange("popularityTier", Number(v) || 2)}
            error={fieldErrors.popularityTier}
          />
          <Field
            label="Meme Strength (1–5)"
            value={String(values.memeStrength)}
            onChange={(v) => handleChange("memeStrength", Number(v) || 3)}
            error={fieldErrors.memeStrength}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-line p-4">
        <legend className="px-2 text-base font-semibold text-ink">Default Vibe Tags</legend>
        <div className="flex flex-wrap gap-2">
          {VIBE_TAGS.map((tag) => {
            const checked = values.defaultVibeTags.includes(tag);
            return (
              <label
                key={tag}
                className={
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors " +
                  (checked
                    ? "border-ink bg-ink text-white"
                    : "border-line-strong bg-panel text-ink hover:border-ink")
                }
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleVibeTagToggle(tag)}
                  className="sr-only"
                />
                {tag}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-line p-4">
        <legend className="px-2 text-base font-semibold text-ink">Style DNA</legend>
        <p className="text-xs text-muted">Comma-separated values for each trait.</p>

        <Field
          label="Tone"
          value={values.styleDna.tone}
          onChange={(v) => handleChange("styleDna.tone", v)}
        />
        <Field
          label="Colors"
          value={values.styleDna.colors}
          onChange={(v) => handleChange("styleDna.colors", v)}
        />
        <Field
          label="Visual Traits"
          value={values.styleDna.visual_traits}
          onChange={(v) => handleChange("styleDna.visual_traits", v)}
          multiline
        />
        <Field
          label="UX Traits"
          value={values.styleDna.ux_traits}
          onChange={(v) => handleChange("styleDna.ux_traits", v)}
          multiline
        />
        <Field
          label="Meme Exaggeration"
          value={values.styleDna.meme_exaggeration}
          onChange={(v) => handleChange("styleDna.meme_exaggeration", v)}
          multiline
        />
        <Field
          label="Iconic Elements"
          value={values.styleDna.iconic_elements}
          onChange={(v) => handleChange("styleDna.iconic_elements", v)}
          multiline
        />
        <Field
          label="Behavioral Stereotypes"
          value={values.styleDna.behavioral_stereotypes}
          onChange={(v) => handleChange("styleDna.behavioral_stereotypes", v)}
          multiline
        />
        <Field
          label="Satirical Patterns"
          value={values.styleDna.satirical_patterns}
          onChange={(v) => handleChange("styleDna.satirical_patterns", v)}
          multiline
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-line p-4">
        <legend className="px-2 text-base font-semibold text-ink">Archetype</legend>

        <Field
          label="Type"
          value={values.archetype.type}
          onChange={(v) => handleChange("archetype.type", v)}
        />
        <Field
          label="Layout"
          value={values.archetype.layout}
          onChange={(v) => handleChange("archetype.layout", v)}
        />
        <Field
          label="Sections"
          value={values.archetype.sections}
          onChange={(v) => handleChange("archetype.sections", v)}
          multiline
        />
        <Field
          label="Content Style"
          value={values.archetype.content_style}
          onChange={(v) => handleChange("archetype.content_style", v)}
          multiline
        />
      </fieldset>

      <div className="pt-2">
        <Button type="submit" variant="ink" size="sm" disabled={submitting}>
          {submitting ? "Creating…" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  error,
  placeholder,
  multiline,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const inputClass =
    "rounded-lg border-2 bg-panel px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none " +
    (error ? "border-red-400" : "border-line-strong");

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-ink">{label}</label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`min-h-[80px] resize-y ${inputClass}`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

