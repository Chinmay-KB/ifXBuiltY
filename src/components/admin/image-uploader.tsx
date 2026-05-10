"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui";

type ImageUploaderProps = {
  /** MIME types to accept, e.g. "image/png,image/jpeg,image/webp" */
  accept: string;
  /** Maximum file size in bytes */
  maxSize: number;
  /** Called with the selected file after validation passes */
  onUpload: (file: File) => Promise<void>;
  /** Label shown on the upload button */
  label: string;
  /** Whether an upload is currently in progress */
  loading?: boolean;
};

/**
 * Reusable file upload component with client-side validation for type and size.
 * Shows error messages for invalid files and a loading state during upload.
 */
export function ImageUploader({
  accept,
  maxSize,
  onUpload,
  label,
  loading = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const acceptedTypes = accept.split(",").map((t) => t.trim());

  function formatSize(bytes: number): string {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    if (!acceptedTypes.includes(file.type)) {
      setError(
        `Invalid file format. Accepted: ${acceptedTypes.map((t) => t.replace("image/", "").toUpperCase()).join(", ")}`,
      );
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size exceeds ${formatSize(maxSize)} limit`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    try {
      await onUpload(file);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    } finally {
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={loading}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? "Uploading…" : label}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
