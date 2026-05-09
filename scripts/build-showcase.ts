/**
 * Dev-only batch generator for homepage showcase images.
 *
 * Requires AI_GATEWAY_API_KEY in .env.local (same as `yarn ai:image`).
 * Uses Vercel AI Gateway; generation incurs real usage on your account.
 *
 * Usage:
 *   yarn showcase:build
 *   yarn showcase:build -- --force
 *   yarn showcase:build -- --limit=3
 *   yarn showcase:build -- --write-manifest   # sets imageSrc to .png in showcase-examples.json
 */

import { generateImage } from "ai";
import dotenv from "dotenv";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { buildGenerationPrompt } from "../src/lib/prompt/build-generation-prompt";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const MODEL =
  process.env.AI_GATEWAY_IMAGE_MODEL?.trim() || "openai/gpt-image-2";

type ShowcaseRow = {
  id: string;
  builder: string;
  target: string;
  tone: string;
  screenType: string;
  region: string;
  extraDetails: string;
  imageSrc: string;
};

function extFromMediaType(mediaType: string): string {
  if (mediaType === "image/png") return "png";
  if (mediaType === "image/jpeg" || mediaType === "image/jpg") return "jpg";
  if (mediaType === "image/webp") return "webp";
  return "png";
}

function parseArgs(argv: string[]) {
  let force = false;
  let writeManifest = false;
  let limit: number | null = null;
  for (const a of argv) {
    if (a === "--force") force = true;
    else if (a === "--write-manifest") writeManifest = true;
    else if (a.startsWith("--limit=")) {
      const n = Number(a.slice("--limit=".length));
      if (Number.isFinite(n) && n > 0) limit = Math.floor(n);
    }
  }
  return { force, writeManifest, limit };
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
    console.error(
      "Missing AI_GATEWAY_API_KEY. Add it to .env.local (see yarn ai:image).",
    );
    process.exit(1);
  }

  const { force, writeManifest, limit } = parseArgs(process.argv.slice(2));

  const jsonPath = resolve(process.cwd(), "src/data/showcase-examples.json");
  const raw = await readFile(jsonPath, "utf8");
  const rows = JSON.parse(raw) as ShowcaseRow[];
  const slice = limit != null ? rows.slice(0, limit) : rows;

  const outDir = resolve(process.cwd(), "public/showcase");
  await mkdir(outDir, { recursive: true });

  const updated: ShowcaseRow[] = [...rows];

  for (const row of slice) {
    const prompt = buildGenerationPrompt({
      builder: row.builder,
      target: row.target,
      tone: row.tone,
      screenType: row.screenType,
      region: row.region,
      extraDetails: row.extraDetails,
    });

    const ext = "png";
    const filePath = resolve(outDir, `${row.id}.${ext}`);
    const relPublic = `/showcase/${row.id}.${ext}`;

    if (!force) {
      try {
        await readFile(filePath);
        console.error(`Skip ${row.id} (exists). Use --force to regenerate.`);
        continue;
      } catch {
        // generate
      }
    }

    console.error(`Generating ${row.id}…`);
    const result = await generateImage({
      model: MODEL,
      prompt,
      size: "1024x1024",
      providerOptions: {
        gateway: {
          tags: ["feature:showcase-build", "app:ifxbuilty"],
        },
      },
    });

    const file = result.image;
    const actualExt = extFromMediaType(file.mediaType);
    const actualPath =
      actualExt === ext ? filePath : resolve(outDir, `${row.id}.${actualExt}`);
    const actualRel =
      actualExt === ext ? relPublic : `/showcase/${row.id}.${actualExt}`;

    await writeFile(actualPath, Buffer.from(file.uint8Array));
    console.error(`Wrote ${actualPath}`);

    if (writeManifest) {
      const idx = updated.findIndex((r) => r.id === row.id);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], imageSrc: actualRel };
      }
    }
  }

  if (writeManifest) {
    await writeFile(jsonPath, `${JSON.stringify(updated, null, 2)}\n`);
    console.error(`Updated ${jsonPath}`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
