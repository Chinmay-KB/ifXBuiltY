import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { ANON_SESSION_COOKIE_NAME } from "@/lib/constants";

function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );
}

/** Returns the anon session id from the cookie when present; does not create one. */
export async function getAnonSessionId(): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(ANON_SESSION_COOKIE_NAME)?.value;
  if (existing && isValidUuid(existing)) {
    return existing;
  }
  return null;
}

/**
 * Returns a stable anonymous session id from the cookie, or creates one and
 * sets it on the outgoing response (httpOnly, SameSite=Lax).
 */
export async function getOrCreateAnonSessionId(): Promise<{
  sessionId: string;
  applyCookie: (res: NextResponse) => void;
}> {
  const existing = await getAnonSessionId();
  if (existing) {
    return { sessionId: existing, applyCookie: () => {} };
  }

  const sessionId = crypto.randomUUID();
  return {
    sessionId,
    applyCookie: (res: NextResponse) => {
      res.cookies.set(ANON_SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        secure: process.env.NODE_ENV === "production",
      });
    },
  };
}
