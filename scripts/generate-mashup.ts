/**
 * Ops mashup generator — ships published generations through the production
 * pipeline. Do not generate mashups by clicking the website.
 *
 * Usage:
 *   yarn generate:mashup --help
 *   yarn generate:mashup --builder ikea --target figma --dry-run
 *
 * Secrets from env only (.env.local). Never commit keys.
 */

import { config } from "dotenv";
import { resolve } from "node:path";

import {
  assertMashupArgs,
  MASHUP_HELP,
  parseMashupArgs,
} from "@/lib/ops/mashup-cli";
import {
  generateMashup,
  type MashupDryRunResult,
  type MashupPublishedResult,
} from "@/lib/ops/mashup-run";
import { generationVariantObjectPath } from "@/lib/generation-media-url";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

function printDryRun(result: MashupDryRunResult) {
  console.log("--- mashup (dry-run) ---");
  console.log(`builder: ${result.builder.name} (${result.builder.id})`);
  console.log(`target:  ${result.target.name} (${result.target.id})`);
  console.log(`screen:  ${result.screenType}`);
  console.log(`model:   ${result.imageModel} (skipped)`);
  console.log("Skipping AI Gateway, storage upload, and DB insert.");
  console.log("");
  console.log("--- prompt ---");
  console.log(result.prompt);
}

function printPublished(result: MashupPublishedResult) {
  console.log("--- mashup published ---");
  console.log(`builder: ${result.builder.name} (${result.builder.id})`);
  console.log(`target:  ${result.target.name} (${result.target.id})`);
  console.log(`id:      ${result.id}`);
  console.log(`slug:    ${result.slug}`);
  console.log(`image:   ${result.imagePath}`);
  console.log(
    `variants: ${generationVariantObjectPath(result.imagePath, "card")}, ${generationVariantObjectPath(result.imagePath, "detail")}, ${generationVariantObjectPath(result.imagePath, "og")}`,
  );
}

async function main() {
  const args = parseMashupArgs(process.argv.slice(2));
  if (args.help || process.argv.slice(2).length === 0) {
    console.log(MASHUP_HELP);
    process.exit(args.help ? 0 : 1);
  }

  assertMashupArgs(args);
  const result = await generateMashup(args);
  switch (result.kind) {
    case "dry-run":
      printDryRun(result);
      return;
    case "published":
      printPublished(result);
      return;
    default: {
      const _exhaustive: never = result;
      throw new Error(`Unhandled mashup result: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(msg);
  process.exit(1);
});
