import { generateText } from "ai";

import { getAiGatewayTextModel } from "@/lib/ai-gateway";

export async function findOfficialSources(productId: string) {
  "use step";

  const searchQuery = encodeURIComponent(`${productId} official product page UI design`);
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${searchQuery}`,
    {
      headers: { "User-Agent": "ifXBuiltY/1.0 (research bot)" },
    },
  );

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  const html = await res.text();
  const urls: string[] = [];
  const urlRegex = /https?:\/\/[^\s"'>]+/g;
  const matches = html.match(urlRegex);
  if (matches) {
    for (const url of matches) {
      const clean = url.replace(/\/$/, "");
      if (
        !urls.includes(clean) &&
        !clean.includes("duckduckgo") &&
        !clean.includes("facebook") &&
        !clean.includes("twitter") &&
        clean.startsWith("https")
      ) {
        urls.push(clean);
      }
    }
  }

  return { productId, officialUrls: urls.slice(0, 5) };
}

export async function fetchPageContent(url: string) {
  "use step";

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ifXBuiltY/1.0 (research bot)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { url, content: null, error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);

    return { url, content: text, error: null };
  } catch (err) {
    return { url, content: null, error: err instanceof Error ? err.message : "fetch failed" };
  }
}

async function generateJson(prompt: string): Promise<Record<string, unknown>> {
  const { text } = await generateText({
    model: getAiGatewayTextModel(),
    prompt,
    temperature: 0.3,
    maxOutputTokens: 2000,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in response: ${text.slice(0, 200)}`);
  }
  return JSON.parse(jsonMatch[0]);
}

export async function summarizeProductProfile(
  productId: string,
  sources: { url: string; content: string | null }[],
) {
  "use step";

  const sourceText = sources
    .filter((s) => s.content)
    .map((s) => `Source: ${s.url}\n${s.content}`)
    .join("\n\n---\n\n");

  const prompt = `You are researching a product for a satirical UI generator. Analyze the following product and return a JSON object with these fields:

- category: one of (search, video, maps, payments, docs, IDE, OS, commerce, social, media, communication, storage, education, dating, browser, project-management, productivity, design, developer, cloud, email, spreadsheet)
- screen_type: one of (desktop web, mobile app, desktop app, console, OS shell)
- popularity_tier: 1 (core), 2 (strong), or 3 (niche-but-memeable)
- style_dna: object with arrays for: tone, colors, visual_traits, ux_traits, meme_exaggeration, iconic_elements, behavioral_stereotypes, satirical_patterns
- archetype: object with: type (string), sections (string[]), layout (string), content_style (string[])

Product: ${productId}

Sources:
${sourceText.slice(0, 12000)}

Return ONLY valid JSON. No markdown, no explanation. Each array should have 3-6 specific, concrete items.`;

  return generateJson(prompt);
}

export async function summarizeMemeDna(productId: string) {
  "use step";

  const prompt = `You are researching the meme culture around a product for a satirical UI generator.

Product: ${productId}

Return a JSON object with:
- observed_memes: 3-5 recurring jokes, complaints, or cultural shorthands about this product
- user_frustrations: 3-5 common user complaints or pain points
- cultural_shorthand: a one-liner that captures the product's cultural reputation

Be specific and satirical but fair. Avoid unverifiable defamatory claims. Focus on observable patterns from social media, reviews, and user communities.

Return ONLY valid JSON. No markdown, no explanation.`;

  const { text } = await generateText({
    model: getAiGatewayTextModel(),
    prompt,
    temperature: 0.7,
    maxOutputTokens: 1000,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in response: ${text.slice(0, 200)}`);
  }
  return JSON.parse(jsonMatch[0]);
}

export async function saveProductDraft(
  productId: string,
  profileDraft: Record<string, unknown>,
  memeDraft: Record<string, unknown>,
  sources: string[],
) {
  "use step";

  const draft = {
    id: productId,
    name: productId
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    parent_company_id: productId.split("-").slice(0, -1).join("-") || null,
    category: (profileDraft.category as string) ?? "",
    screen_type: (profileDraft.screen_type as string) ?? "",
    popularity_tier: (profileDraft.popularity_tier as number) ?? 2,
    style_dna: profileDraft.style_dna ?? {},
    archetype: profileDraft.archetype ?? {},
    meme_dna: memeDraft,
    reference_urls: sources,
    screenshot_targets: [],
    screenshot_paths: [],
    research_status: "researched",
    default_vibe_tags: [],
  };

  const { writeFileSync, mkdirSync, existsSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const projectRoot = join(__dirname, "../..");
  const profilesDir = join(projectRoot, "src", "data", "product-profiles");

  if (!existsSync(profilesDir)) {
    mkdirSync(profilesDir, { recursive: true });
  }

  const filePath = join(profilesDir, `${productId}.json`);
  writeFileSync(filePath, JSON.stringify(draft, null, 2), "utf-8");

  return { filePath, draft };
}
