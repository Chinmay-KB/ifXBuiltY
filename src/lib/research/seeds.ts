import seeds from "@/data/research-seeds.json";

export type ResearchSeedCompany = { name: string; maxProducts: number };
export type ResearchSeedCategory = { name: string; maxProducts: number };
export type ResearchWave = {
  id: string;
  label: string;
  maxProductsPerRun: number;
  targetReviewReady: number;
};

export function getResearchWaves(): ResearchWave[] {
  return seeds.waves;
}

export function getResearchSeedCompanies(): ResearchSeedCompany[] {
  return seeds.companies;
}

export function getResearchSeedCategories(): ResearchSeedCategory[] {
  return seeds.categories;
}

export function defaultMaxProductsForWave(waveId: string): number {
  const wave = seeds.waves.find((w) => w.id === waveId);
  return wave?.maxProductsPerRun ?? 5;
}
