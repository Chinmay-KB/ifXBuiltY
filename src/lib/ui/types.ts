/**
 * Shared UI types for the redesigned ifXBuiltY experience.
 * These extend and formalize the data shapes used across feed, generation, and remix flows.
 */

export type FeedItem = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  imageUrl: string | null;
  netScore: number;
  remixCount: number;
  createdAt: string;
  tone?: string;
  vibeTags?: string[];
  screenType?: string;
  region?: string;
  extraDetails?: string;
  imagePath?: string | null;
  upvoteCount?: number;
  downvoteCount?: number;
};

export type FeedSort = "trending" | "newest" | "top" | "remixes";

export type GenerationInputs = {
  builder: string;
  target: string;
  extraDetails: string;
  /** Visual vibe / tone label (e.g. Chaotic, Scammy) — folded into prompt + stored on row */
  tone?: string;
};

export type GenerationResult = {
  id: number;
  slug: string;
  imageUrl: string | null;
  builder: string;
  target: string;
};

export type RemixSource = {
  id: number;
  label: string; // "if [builder] built [target]"
  imageUrl: string | null;
};

export type FeedPageState = {
  sort: "trending" | "newest" | "top";
  builders: string[];
  targets: string[];
};

export type GeneratePageState = {
  phase: "input" | "loading" | "result" | "error";
  inputs: GenerationInputs;
  result: GenerationResult | null;
  error: string | null;
  remixSource: RemixSource | null;
};

export type CardVoteState = {
  score: number;
  userVote: 1 | -1 | null;
  isPending: boolean;
};
