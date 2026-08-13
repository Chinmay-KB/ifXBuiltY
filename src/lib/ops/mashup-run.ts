import { listSelectableProfileLookups } from "@/data/company-profiles";
import {
  resolveProfileLookup,
  type ProfileLookup,
} from "@/data/generator-profile-options";
import { SUPERADMIN_EMAIL } from "@/lib/admin-constants";
import {
  assertAiGatewayConfigured,
  getGenerationImagesBucket,
} from "@/lib/env-server";
import { updateGenerationStatus } from "@/lib/generation/db";
import { executeImageGeneration } from "@/lib/generation/execute-image";
import {
  assembleMashupPrompt,
  combineUserExtraDetails,
  mashupListingFields,
  type MashupCliArgs,
  type MashupListingFields,
} from "@/lib/ops/mashup-cli";
import { mergeCompanyPair } from "@/lib/prompt/merge-company-pair";
import { normalizeRenderMode } from "@/lib/screen-type";
import { makeGenerationSlugSnippet } from "@/lib/slug";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sanitizeVibeTags } from "@/lib/vibe-tags";

const DEFAULT_GATEWAY_IMAGE_MODEL = "openai/gpt-image-2";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type MashupDryRunResult = {
  kind: "dry-run";
  builder: ProfileLookup;
  target: ProfileLookup;
  screenType: string;
  imageModel: string;
  extraDetails: string;
  prompt: string;
};

export type MashupInsertedResult = {
  kind: "inserted";
  visibility: MashupListingFields["visibility"];
  builder: ProfileLookup;
  target: ProfileLookup;
  screenType: string;
  imageModel: string;
  extraDetails: string;
  prompt: string;
  id: number;
  slug: string;
  imagePath: string;
};

export type MashupGenerateResult = MashupDryRunResult | MashupInsertedResult;

function gatewayImageModel(): string {
  return process.env.AI_GATEWAY_IMAGE_MODEL?.trim() || DEFAULT_GATEWAY_IMAGE_MODEL;
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

async function resolveOpsCreatorId(explicit: string | null): Promise<string> {
  const fromFlag = explicit?.trim() ?? "";
  const fromEnv = process.env.GENERATION_OPS_CREATOR_ID?.trim() ?? "";
  const candidate = fromFlag || fromEnv;
  if (candidate) {
    if (!isUuid(candidate)) {
      throw new Error("creator id must be a UUID (auth.users id)");
    }
    return candidate;
  }

  const supabase = createSupabaseServiceClient();
  const perPage = 200;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(`Could not list auth users: ${error.message}`);
    }
    const match = data.users.find((u) => u.email === SUPERADMIN_EMAIL);
    if (match) return match.id;
    if (data.users.length < perPage) break;
  }

  throw new Error(
    "Could not resolve a creator for the row. Pass --creator-id <auth.users uuid> or set GENERATION_OPS_CREATOR_ID. No credits are debited.",
  );
}

async function resolvePair(
  builderQuery: string,
  targetQuery: string,
): Promise<{ builder: ProfileLookup; target: ProfileLookup }> {
  const profiles = await listSelectableProfileLookups();
  const builder = resolveProfileLookup(builderQuery, profiles);
  const target = resolveProfileLookup(targetQuery, profiles);
  if (builder.id === target.id) {
    throw new Error("builder and target must resolve to different profiles");
  }
  return { builder, target };
}

async function insertGenerationRow(args: {
  creatorId: string;
  builderName: string;
  targetName: string;
  extraDetails: string;
  prompt: string;
  screenType: string;
  vibeTags: string[];
  listing: MashupListingFields;
}): Promise<{ id: number; slug: string; objectPath: string }> {
  const supabase = createSupabaseServiceClient();
  const baseSlug = makeGenerationSlugSnippet({
    builder: args.builderName,
    target: args.targetName,
  });
  const plannedExt = "png";

  for (let attempt = 0; attempt < 8; attempt++) {
    const slug =
      attempt === 0 ? baseSlug : `${baseSlug.slice(0, 32)}-${attempt}`;
    const objectPath = `${args.creatorId}/${slug}.${plannedExt}`;

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        creator_id: args.creatorId,
        slug,
        builder: args.builderName,
        target: args.targetName,
        tone: "",
        vibe_tags: sanitizeVibeTags(args.vibeTags),
        screen_type: args.screenType,
        region: "",
        extra_details: args.extraDetails,
        generated_prompt: args.prompt,
        image_path: objectPath,
        visibility: args.listing.visibility,
        moderation_status: args.listing.moderation_status,
        status: "queued",
        image_ready: false,
      })
      .select("id, slug")
      .maybeSingle();

    if (!insErr && row) {
      return { id: row.id, slug: row.slug, objectPath };
    }
    if (insErr?.code === "23505") continue;
    throw new Error(
      `Could not insert generation: ${insErr?.message ?? "unknown error"}`,
    );
  }

  throw new Error("Could not allocate unique slug");
}

/**
 * Build the production prompt and either return it (--dry-run) or insert
 * through executeImageGeneration (no Dodo debit). Default listing is draft;
 * pass --publish after review to insert a public row.
 */
export async function generateMashup(
  args: MashupCliArgs,
): Promise<MashupGenerateResult> {
  const { builder, target } = await resolvePair(args.builder, args.target);
  const merged = await mergeCompanyPair(builder.id, target.id);
  const screenType = normalizeRenderMode(args.screenType ?? "desktop");
  const extraDetails = combineUserExtraDetails(merged.extraDetails, {
    extraDetails: args.extraDetails,
    inventedName: args.inventedName,
  });
  const prompt = assembleMashupPrompt({
    builder: merged.builder,
    target: merged.target,
    mergedExtraDetails: merged.extraDetails,
    extraDetails: args.extraDetails,
    inventedName: args.inventedName,
    screenType,
  });
  const imageModel = gatewayImageModel();

  if (args.dryRun) {
    return {
      kind: "dry-run",
      builder,
      target,
      screenType,
      imageModel,
      extraDetails,
      prompt,
    };
  }

  assertAiGatewayConfigured();
  const creatorId = await resolveOpsCreatorId(args.creatorId);
  const listing = mashupListingFields(args.publish);
  const inserted = await insertGenerationRow({
    creatorId,
    builderName: merged.builder,
    targetName: merged.target,
    extraDetails,
    prompt,
    screenType,
    vibeTags: merged.builderDefaultVibeTags,
    listing,
  });

  try {
    await updateGenerationStatus(inserted.id, {
      status: "processing",
      startedAt: new Date().toISOString(),
      errorMessage: null,
    });

    const image = await executeImageGeneration({
      generationId: inserted.id,
      userId: creatorId,
      dodoCustomerId: "",
      entitlementId: "",
      bucket: getGenerationImagesBucket(),
      objectPath: inserted.objectPath,
      prompt,
      imageModel,
      builderId: builder.id,
      builderName: merged.builder,
      renderMode: screenType,
    });

    await updateGenerationStatus(inserted.id, {
      status: "completed",
      imagePath: image.imagePath,
      imageReady: true,
      completedAt: new Date().toISOString(),
      errorMessage: null,
    });

    return {
      kind: "inserted",
      visibility: listing.visibility,
      builder,
      target,
      screenType,
      imageModel,
      extraDetails,
      prompt,
      id: inserted.id,
      slug: inserted.slug,
      imagePath: image.imagePath,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    await updateGenerationStatus(inserted.id, {
      status: "failed",
      errorMessage: msg,
      completedAt: new Date().toISOString(),
    });
    throw e;
  }
}
