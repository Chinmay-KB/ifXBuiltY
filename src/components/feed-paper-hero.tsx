/** Paper “Desktop — Feed (v2)” hero band. */
export function FeedPaperHero({
  ideasThisWeek,
}: {
  /** Rolling 7-day count of published generations (from `/api/feed`). */
  ideasThisWeek: number;
}) {
  return (
    <div className="flex flex-col gap-6 border-b border-line px-6 pb-7 pt-10 sm:flex-row sm:items-end sm:justify-between lg:px-10">
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
          The feed
        </p>
        <h1 className="max-w-xl font-display text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[0.9] tracking-[-0.04em] text-ink">
          Best of the
          <br />
          multiverse.
        </h1>
      </div>
      <div className="flex flex-col items-start gap-1.5 pb-1 sm:items-end">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
          Fresh generations
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[38px] font-black leading-none text-ink">
            {ideasThisWeek > 0 ? Math.min(ideasThisWeek, 9999) : "—"}
          </span>
          <span className="font-sans text-sm font-medium text-muted">ideas this week</span>
        </div>
      </div>
    </div>
  );
}
