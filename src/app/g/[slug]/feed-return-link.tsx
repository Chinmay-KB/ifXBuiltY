"use client";

type FeedReturnLinkProps = {
  className?: string;
  children: React.ReactNode;
};

export function FeedReturnLink({ className, children }: FeedReturnLinkProps) {
  function returnToFeed() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.assign("/feed");
  }

  return (
    <button type="button" onClick={returnToFeed} className={className}>
      {children}
    </button>
  );
}
