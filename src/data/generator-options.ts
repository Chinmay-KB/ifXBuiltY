/**
 * Dropdown options for the generator form.
 * Builder options come from company-profiles.json.
 * Target options are curated companies/products.
 */

import companyProfiles from "./company-profiles.json";

export type BuilderOption = {
  id: string;
  name: string;
};

export type TargetOption = {
  id: string;
  name: string;
};

/** All available builders derived from company profiles */
export const BUILDER_OPTIONS: BuilderOption[] = companyProfiles.map((p) => ({
  id: p.id,
  name: p.name,
}));

/** Curated target companies/products */
export const TARGET_OPTIONS: TargetOption[] = [
  { id: "linkedin", name: "LinkedIn" },
  { id: "tinder", name: "Tinder" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "instagram", name: "Instagram" },
  { id: "gmail", name: "Gmail" },
  { id: "jira", name: "Jira" },
  { id: "slack", name: "Slack" },
  { id: "notion", name: "Notion" },
  { id: "spotify", name: "Spotify" },
  { id: "uber", name: "Uber" },
  { id: "amazon", name: "Amazon" },
  { id: "youtube", name: "YouTube" },
  { id: "twitter", name: "Twitter/X" },
];
