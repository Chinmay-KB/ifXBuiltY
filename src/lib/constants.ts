/** After this many distinct anonymous reports, a published generation is auto-hidden. */
export const REPORT_COUNT_HIDE_THRESHOLD = 5;

export const FEED_DEFAULT_LIMIT = 20;
export const FEED_MAX_LIMIT = 50;

/** HttpOnly cookie storing an opaque UUID for anonymous vote/report deduping. */
export const ANON_SESSION_COOKIE_NAME = "ifx_anon_sid";
