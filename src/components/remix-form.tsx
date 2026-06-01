"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { GeneratorForm } from "@/components/generator-form";
import type { GeneratorProfileGroup } from "@/data/generator-profile-options";
import { pollGenerationUntilDone } from "@/lib/generation/poll-until-done";
import type {
  GenerationInputs,
  GenerationResult,
  RemixSource,
} from "@/lib/ui/types";

type RemixFormProps = {
  signedIn: boolean;
  profileGroups: GeneratorProfileGroup[];
  remixSource: RemixSource;
  initialValues: Partial<GenerationInputs>;
};

/**
 * RemixForm wraps GeneratorForm with remix-specific behavior:
 * - Pre-fills all six fields from the source generation
 * - Displays "Remixing from..." attribution strip with source label and thumbnail
 * - Stores parent_generation_id on submission (handled by GeneratorForm via remixSource.id)
 */
export function RemixForm({
  signedIn,
  profileGroups,
  remixSource,
  initialValues,
}: RemixFormProps) {
  const router = useRouter();

  const handleGenerated = useCallback(
    (result: GenerationResult) => {
      void (async () => {
        try {
          const final = await pollGenerationUntilDone(result.id);
          router.push(`/g/${final.slug}`);
        } catch {
          router.push(`/g/${result.slug}`);
        }
      })();
    },
    [router],
  );

  return (
    <GeneratorForm
      signedIn={signedIn}
      profileGroups={profileGroups}
      initialValues={initialValues}
      remixSource={remixSource}
      onGenerated={handleGenerated}
    />
  );
}
