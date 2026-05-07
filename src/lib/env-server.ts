/**
 * Server-only environment helpers (Route Handlers, Server Actions).
 * Do not import from client components.
 */

export function getGenerationImagesBucket(): string {
  const id = process.env.GENERATION_IMAGES_BUCKET?.trim();
  if (id) return id;
  return "generation-images";
}

/**
 * Vercel AI Gateway: use `AI_GATEWAY_API_KEY` locally or in CI, or
 * `VERCEL_OIDC_TOKEN` after `vercel env pull` / automatic OIDC on Vercel.
 */
export function assertAiGatewayConfigured(): void {
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  const oidc = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!apiKey && !oidc) {
    throw new Error(
      "Missing AI gateway credentials: set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN",
    );
  }
}
