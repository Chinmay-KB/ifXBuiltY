import { generateImage } from 'ai';
import dotenv from 'dotenv';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MODEL = 'openai/gpt-image-2';

function extensionForMediaType(mediaType: string): string {
  if (mediaType === 'image/png') return 'png';
  if (mediaType === 'image/jpeg' || mediaType === 'image/jpg') return 'jpg';
  if (mediaType === 'image/webp') return 'webp';
  const sub = mediaType.split('/')[1];
  return sub ? sub.split('+')[0] ?? 'bin' : 'bin';
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
    console.error(
      'Set AI_GATEWAY_API_KEY in .env.local (Vercel → AI Gateway, or paste from the dashboard).'
    );
    process.exit(1);
  }

  const prompt =
    process.argv.slice(2).join(' ').trim() ||
    'A minimalist poster: one bold geometric shape on a soft gradient background.';

  console.error(`Generating with ${MODEL}…`);
  const result = await generateImage({
    model: MODEL,
    prompt,
  });

  const file = result.image;
  const ext = extensionForMediaType(file.mediaType);
  const outPath = resolve(process.cwd(), `generated-image.${ext}`);
  await writeFile(outPath, file.uint8Array);
  console.error(`Saved ${outPath} (${file.mediaType})`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
