import { buildGenerationPrompt } from "@/lib/prompt/build-generation-prompt";
import { normalizeRenderMode } from "@/lib/screen-type";

export type MashupCliArgs = {
  builder: string;
  target: string;
  extraDetails: string;
  inventedName: string;
  screenType: string | null;
  dryRun: boolean;
  help: boolean;
  creatorId: string | null;
};

const FLAG_ALIASES: Record<string, string> = {
  "-b": "--builder",
  "-t": "--target",
  "-e": "--extra-details",
  "--extra": "--extra-details",
  "--name": "--invented-name",
  "--screen": "--screen-type",
  "-h": "--help",
};

export const MASHUP_HELP = `Usage:
  yarn generate:mashup --builder <slug|name> --target <slug|name> [options]

Ops CLI for shipping mashups. Do not generate by clicking the website.
Reuses the production path: Style DNA merge (mergeCompanyPair) →
buildGenerationPrompt → executeImageGeneration (Vercel AI Gateway,
default openai/gpt-image-2) → sharp card/detail/og variants → upload to
the public generation-images bucket → insert a published generations row.
Does not debit Dodo credits and does not require a logged-in session.

Options:
  --builder, -b           Builder slug or exact name (live company_profiles)
  --target, -t            Target slug or exact name
  --extra-details, -e     Prompt extras (not new catalog nouns)
  --invented-name         Invented on-screen product name
  --screen-type           mobile | desktop (default: desktop, same as /api/generate)
  --dry-run               Print the fully built prompt; skip Gateway, upload, DB insert
  --creator-id            auth.users UUID that owns the published row
  -h, --help              Show this help

Env:
  DRY_RUN=1               Same as --dry-run
  GENERATION_OPS_CREATOR_ID
                          Default creator UUID if --creator-id is omitted
  AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN
  SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY
  NEXT_PUBLIC_SUPABASE_URL
  Optional: AI_GATEWAY_IMAGE_MODEL, GENERATION_IMAGES_BUCKET,
  NEXT_PUBLIC_GENERATION_IMAGES_BUCKET

Catalog JSON in the repo is inert until imported. Nouns resolve from
Supabase company_profiles (slug first, then exact name). Ambiguous names fail.

Example pairings (picker brands already live; extras are prompt notes):

  yarn generate:mashup --builder ikea --target figma --invented-name SKISSA \\
    --extra-details 'Empty Figma canvas. Microcopy: "Some assembly required." The move tool is an Allen key.'

  yarn generate:mashup --builder apple-ios --target tinder --screen-type mobile --invented-name Halo \\
    --extra-details 'Tinder deck plus a Personality slider.'

  yarn generate:mashup --builder duolingo --target apple-ios --screen-type mobile --invented-name Perch \\
    --extra-details 'Lock screen. Streak dying.'

  yarn generate:mashup --builder google --target google-gmail --invented-name Burst \\
    --extra-details 'Gmail compose with 8× Send.'

Dry-run (no paid image call):
  yarn generate:mashup --builder ikea --target figma --dry-run
`;

function envDryRun(env: Record<string, string | undefined>): boolean {
  const raw = env.DRY_RUN?.trim();
  return raw === "1" || raw?.toLowerCase() === "true";
}

function canonicalFlag(raw: string): string {
  return FLAG_ALIASES[raw] ?? raw;
}

function splitFlag(arg: string): { flag: string; value: string | undefined } {
  const eq = arg.indexOf("=");
  if (eq === -1) return { flag: canonicalFlag(arg), value: undefined };
  return {
    flag: canonicalFlag(arg.slice(0, eq)),
    value: arg.slice(eq + 1),
  };
}

export function parseMashupArgs(
  argv: string[],
  env: Record<string, string | undefined> = process.env,
): MashupCliArgs {
  const out: MashupCliArgs = {
    builder: "",
    target: "",
    extraDetails: "",
    inventedName: "",
    screenType: null,
    dryRun: envDryRun(env),
    help: false,
    creatorId: null,
  };

  const args = argv.filter((a) => a !== "--");

  for (let i = 0; i < args.length; i++) {
    const raw = args[i]!;
    if (!raw.startsWith("-")) {
      throw new Error(`Unexpected argument "${raw}". See --help.`);
    }

    const { flag, value } = splitFlag(raw);

    const takeValue = (): string => {
      if (value !== undefined) return value;
      const next = args[i + 1];
      if (!next || next.startsWith("-")) {
        throw new Error(`Missing value for ${flag}`);
      }
      i += 1;
      return next;
    };

    switch (flag) {
      case "--help":
        out.help = true;
        break;
      case "--dry-run":
        out.dryRun = true;
        break;
      case "--builder":
        out.builder = takeValue();
        break;
      case "--target":
        out.target = takeValue();
        break;
      case "--extra-details":
        out.extraDetails = takeValue();
        break;
      case "--invented-name":
        out.inventedName = takeValue();
        break;
      case "--screen-type":
        out.screenType = takeValue();
        break;
      case "--creator-id":
        out.creatorId = takeValue();
        break;
      default:
        throw new Error(`Unknown flag "${raw}". See --help.`);
    }
  }

  return out;
}

export function assertMashupArgs(args: MashupCliArgs): void {
  if (args.help) return;
  if (!args.builder.trim() || !args.target.trim()) {
    throw new Error("Both --builder and --target are required. See --help.");
  }
}

export function combineUserExtraDetails(
  mergedExtra: string,
  opts: { extraDetails: string; inventedName: string },
): string {
  const notes: string[] = [];
  const invented = opts.inventedName.trim();
  if (invented) {
    notes.push(
      `Invented on-screen product name: ${invented}. Use this invented name in the UI chrome; do not show real brand names as logos.`,
    );
  }
  const extra = opts.extraDetails.trim();
  if (extra) notes.push(extra);
  if (notes.length === 0) return mergedExtra;
  return `${mergedExtra}

Additional notes from user:
${notes.join("\n")}`;
}

export function assembleMashupPrompt(input: {
  builder: string;
  target: string;
  mergedExtraDetails: string;
  extraDetails: string;
  inventedName: string;
  screenType: string;
}): string {
  return buildGenerationPrompt({
    builder: input.builder,
    target: input.target,
    extraDetails: combineUserExtraDetails(input.mergedExtraDetails, {
      extraDetails: input.extraDetails,
      inventedName: input.inventedName,
    }),
    screenType: normalizeRenderMode(input.screenType),
  });
}
