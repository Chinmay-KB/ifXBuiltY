"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";
import { VIBE_TAGS } from "@/lib/vibe-tags";

// --- Validation ---

const SLUG_REGEX = /^[a-z0-9-]+$/;
const MAX_SLUG_LENGTH = 60;

// --- Types ---

export type StyleDnaValues = {
  tone: string;
  colors: string;
  visual_traits: string;
  ux_traits: string;
  meme_exaggeration: string;
  iconic_elements: string;
};

export type ArchetypeValues = {
  type: string;
  sections: string;
  layout: string;
  content_style: string;
};

export type CompanyFormValues = {
  id: string;
  name: string;
  defaultVibeTags: string[];
  styleDna: StyleDnaValues;
  archetype: ArchetypeValues;
};

type CompanyFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<CompanyFormValues>;
  onSuccess?: () => void;
};

type FieldErrors = Record<string, string>;

const EMPTY_STYLE_DNA: StyleDnaValues = {
  tone: "",
  colors: "",
  visual_traits: "",
  ux_traits: "",
  meme_exaggeration: "",
  iconic_elements: "",
};

const EMPTY_ARCHETYPE: ArchetypeValues = {
  type: "",
  sections: "",
  layout: "",
  content_style: "",
};

const EMPTY_VALUES: CompanyFormValues = {
  id: "",
  name: "",
  defaultVibeTags: [],
  styleDna: EMPTY_STYLE_DNA,
  archetype: EMPTY_ARCHETYPE,
};

/** Convert comma-separated string to array */
function toArray(s: string): string[] {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Convert array to comma-separated string for editing */
function fromArray(arr: string[] | undefined): string {
  return (arr ?? []).join(", ");
}

// --- Component ---

export function CompanyForm({ mode, initialValues, onSuccess }: CompanyFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<CompanyFormValues>(() => {
    if (!initialValues) return EMPTY_VALUES;
    return {
      id: initialValues.id ?? "",
      name: initialValues.name ?? "",
      defaultVibeTags: initialValues.defaultVibeTags ?? [],
      styleDna: initialValues.styleDna ?? EMPTY_STYLE_DNA,
      archetype: initialValues.archetype ?? EMPTY_ARCHETYPE,
    };
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(path: string, value: string) {
    setValues((prev) => {
      const next = { ...prev };
      if (path === "id" || path === "name") {
        (next as Record<string, unknown>)[path] = value;
      } else if (path.startsWith("styleDna.")) {
        const key = path.replace("styleDna.", "") as keyof StyleDnaValues;
        next.styleDna = { ...next.styleDna, [key]: value };
      } else if (path.startsWith("archetype.")) {
        const key = path.replace("archetype.", "") as keyof ArchetypeValues;
        next.archetype = { ...next.archetype, [key]: value };
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
    if (mode === "create") {
      const slug = values.id.trim();
      if (!slug) errors.id = "Slug is required";
      else if (slug.length > MAX_SLUG_LENGTH) errors.id = `Max ${MAX_SLUG_LENGTH} characters`;
      else if (!SLUG_REGEX.test(slug)) errors.id = "Only lowercase letters, numbers, and hyphens";
    }
    if (!values.name.trim()) errors.name = "Name is required";
    else if (values.name.trim().length > 100) errors.name = "Max 100 characters";
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

    // Build the payload with arrays from comma-separated strings
    const payload = {
      id: values.id.trim(),
      name: values.name.trim(),
      defaultVibeTags: values.defaultVibeTags,
      styleDna: {
        tone: toArray(values.styleDna.tone),
        colors: toArray(values.styleDna.colors),
        visual_traits: toArray(values.styleDna.visual_traits),
        ux_traits: toArray(values.styleDna.ux_traits),
        meme_exaggeration: toArray(values.styleDna.meme_exaggeration),
        iconic_elements: toArray(values.styleDna.iconic_elements),
      },
      archetype: {
        type: values.archetype.type.trim(),
        sections: toArray(values.archetype.sections),
        layout: values.archetype.layout.trim(),
        content_style: toArray(values.archetype.content_style),
      },
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/companies"
          : `/api/admin/companies/${values.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? `Request failed (${res.status})`;
        if (res.status === 409) {
          setFieldErrors({ id: "A company with this slug already exists" });
        } else {
          setServerError(message);
        }
        return;
      }

      if (mode === "create") {
        router.push(`/admin/companies/${values.id.trim()}`);
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

      {/* Basic fields */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-base font-semibold text-ink">Basic Info</legend>

        {mode === "create" ? (
          <Field
            label="Slug (ID)"
            hint="Lowercase letters, numbers, and hyphens only."
            value={values.id}
            onChange={(v) => handleChange("id", v)}
            error={fieldErrors.id}
            placeholder="e.g. netflix"
          />
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Slug (ID)</label>
            <p className="rounded-lg border-2 border-line bg-canvas px-3 py-2 text-sm text-muted">
              {values.id}
            </p>
          </div>
        )}

        <Field
          label="Name"
          value={values.name}
          onChange={(v) => handleChange("name", v)}
          error={fieldErrors.name}
          placeholder="e.g. Netflix"
        />
      </fieldset>

      {/* Default Vibe Tags */}
      <fieldset className="flex flex-col gap-3 rounded-lg border border-line p-4">
        <legend className="px-2 text-base font-semibold text-ink">Default Vibe Tags</legend>
        <p className="text-xs text-muted">
          Tags automatically applied to generations from this company.
        </p>
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

      {/* Style DNA */}
      <fieldset className="flex flex-col gap-4 rounded-lg border border-line p-4">
        <legend className="px-2 text-base font-semibold text-ink">Style DNA</legend>
        <p className="text-xs text-muted">Comma-separated values for each trait.</p>

        <Field
          label="Tone"
          value={values.styleDna.tone}
          onChange={(v) => handleChange("styleDna.tone", v)}
          placeholder="e.g. cinematic, bold, minimal"
        />
        <Field
          label="Colors"
          value={values.styleDna.colors}
          onChange={(v) => handleChange("styleDna.colors", v)}
          placeholder="e.g. red, black, white"
        />
        <Field
          label="Visual Traits"
          value={values.styleDna.visual_traits}
          onChange={(v) => handleChange("styleDna.visual_traits", v)}
          placeholder="e.g. hero banners, movie rows, autoplay trailers"
          multiline
        />
        <Field
          label="UX Traits"
          value={values.styleDna.ux_traits}
          onChange={(v) => handleChange("styleDna.ux_traits", v)}
          placeholder="e.g. infinite scroll, personalized recommendations"
          multiline
        />
        <Field
          label="Meme Exaggeration"
          value={values.styleDna.meme_exaggeration}
          onChange={(v) => handleChange("styleDna.meme_exaggeration", v)}
          placeholder="e.g. everything is a streak, guilt-trip notifications, confetti on every action"
          multiline
        />
        <Field
          label="Iconic Elements"
          value={values.styleDna.iconic_elements}
          onChange={(v) => handleChange("styleDna.iconic_elements", v)}
          placeholder="e.g. green owl, neon green charts, blue corporate banner"
          multiline
        />
      </fieldset>

      {/* Archetype */}
      <fieldset className="flex flex-col gap-4 rounded-lg border border-line p-4">
        <legend className="px-2 text-base font-semibold text-ink">Archetype</legend>
        <p className="text-xs text-muted">Structural and content patterns.</p>

        <Field
          label="Type"
          value={values.archetype.type}
          onChange={(v) => handleChange("archetype.type", v)}
          placeholder="e.g. streaming platform, professional network"
        />
        <Field
          label="Layout"
          value={values.archetype.layout}
          onChange={(v) => handleChange("archetype.layout", v)}
          placeholder="e.g. full-bleed hero with content rows"
        />
        <Field
          label="Sections"
          value={values.archetype.sections}
          onChange={(v) => handleChange("archetype.sections", v)}
          placeholder="e.g. top navbar, hero banner, content rows, footer"
          multiline
        />
        <Field
          label="Content Style"
          value={values.archetype.content_style}
          onChange={(v) => handleChange("archetype.content_style", v)}
          placeholder="e.g. movie posters, episode thumbnails, trailers"
          multiline
        />
      </fieldset>

      {/* Submit */}
      <div className="pt-2">
        <Button type="submit" variant="ink" size="sm" disabled={submitting}>
          {submitting
            ? mode === "create" ? "Creating…" : "Saving…"
            : mode === "create" ? "Create Company" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

// --- Reusable Field ---

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
