export type FeedSort = "newest" | "trending" | "top" | "remixes";

export type FeedItem = {
  id: number;
  slug: string;
  builder: string;
  target: string;
  tone: string;
  vibeTags: string[];
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
  /** Published generations created in the trailing 7 days (global, ignores page filters). */
  ideasThisWeek?: number;
  warning?: string;
};
