import type { ReactNode } from "react";

type FeedSectionChromeProps = {
  filterBar: ReactNode;
  children: ReactNode;
  /** Homepage embed uses tighter horizontal padding on the sticky bar. */
  stickyClassName?: string;
  contentClassName?: string;
};

export function FeedSectionChrome({
  filterBar,
  children,
  stickyClassName = "sticky top-0 z-30 bg-canvas/95 backdrop-blur-sm md:top-20",
  contentClassName = "mt-6 flex-1 px-4 pb-10 sm:px-6 lg:px-10",
}: FeedSectionChromeProps) {
  return (
    <>
      <div className={stickyClassName}>{filterBar}</div>
      <div className={contentClassName}>{children}</div>
    </>
  );
}
