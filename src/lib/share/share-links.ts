export type SharePlatform = "x" | "linkedin" | "reddit";

export type SharePayload = {
  /** Absolute canonical URL to the public generation page. */
  url: string;
  /** Prefilled post text for platforms that support it. */
  text: string;
  /** Title-like string (used by Reddit submit). */
  title: string;
  /** Platform-specific external share URLs. */
  platform: Record<SharePlatform, string>;
};

function safeEncode(value: string) {
  return encodeURIComponent(value);
}

function joinUrl(origin: string, path: string) {
  const o = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${o}${p}`;
}

export function buildSharePayload(input: {
  origin: string;
  slug: string;
  builder: string;
  target: string;
}): SharePayload {
  const url = joinUrl(input.origin, `/g/${safeEncode(input.slug)}`);
  const builder = input.builder.trim() || "whatever company";
  const target = input.target.trim() || "whatever thing";

  const text = `What if "${builder}" built "${target}"? ${url}`;
  const title = `What if "${builder}" built "${target}"?`;

  const x = `https://x.com/intent/tweet?text=${safeEncode(text)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${safeEncode(url)}`;
  const reddit = `https://www.reddit.com/submit?url=${safeEncode(url)}&title=${safeEncode(title)}`;

  return {
    url,
    text,
    title,
    platform: { x, linkedin, reddit },
  };
}

