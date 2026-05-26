import { createGateway, type GatewayProvider } from "@ai-sdk/gateway";

import { assertAiGatewayConfigured } from "@/lib/env-server";

const DEFAULT_TEXT_MODEL = "openai/gpt-4o-mini";

let cached: GatewayProvider | undefined;

/** Gateway provider authenticated via `AI_GATEWAY_API_KEY` or OIDC. */
export function getAiGateway(): GatewayProvider {
  assertAiGatewayConfigured();
  if (!cached) {
    const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
    cached = createGateway(apiKey ? { apiKey } : {});
  }
  return cached;
}

export function getAiGatewayTextModel(modelId = DEFAULT_TEXT_MODEL) {
  return getAiGateway()(modelId);
}
