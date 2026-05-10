/**
 * Dropdown options for the generator form.
 * Both builder and target options come from company-profiles.json.
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

/** All available targets derived from company profiles */
export const TARGET_OPTIONS: TargetOption[] = companyProfiles.map((p) => ({
  id: p.id,
  name: p.name,
}));
