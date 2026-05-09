export type FeedSort = "newest" | "trending" | "top";

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
  hasMore: boolean;
  warning?: string;
};
