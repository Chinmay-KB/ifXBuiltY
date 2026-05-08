export type FeedSort = "newest" | "trending";

export type FeedItem = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  tone: string;
  screenType: string;
  region: string;
  extraDetails: string;
  imageUrl: string | null;
  imagePath: string | null;
  upvoteCount: number;
  downvoteCount: number;
  netScore: number;
  remixCount: number;
  createdAt: string;
};

export type FeedResponse = {
  sort: FeedSort;
  items: FeedItem[];
  warning?: string;
};
