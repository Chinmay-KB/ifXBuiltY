import raw from "./showcase-examples.json";

export type ShowcaseExample = {
  id: string;
  builder: string;
  target: string;
  tone: string;
  screenType: string;
  region: string;
  extraDetails: string;
  imageSrc: string;
};

export const SHOWCASE_EXAMPLES: ShowcaseExample[] = raw;
