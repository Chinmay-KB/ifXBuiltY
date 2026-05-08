import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { tryGetSupabasePublicEnv } from "@/lib/supabase/public-env";

/**
 * Exchanges OAuth PKCE `code` for a session and sets auth cookies.
 * @see https://supabase.com/docs/guides/auth/sessions/pkce-flow
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const oauthDescription = url.searchParams.get("error_description");

  let next =
    url.searchParams.get("next") ??
    request.cookies.get("ifxb_next")?.value ??
    "/";
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/";
  }

  if (oauthError) {
    const msg = oauthDescription ?? oauthError;
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(msg)}`,
    );
  }

  const env = tryGetSupabasePublicEnv();
  if (!env) {
    return NextResponse.redirect(`${url.origin}/login?error=missing_supabase_env`);
  }

  if (!code) {
    return NextResponse.redirect(`${url.origin}/login?error=missing_code`);
  }

  let response = NextResponse.redirect(`${url.origin}${next}`);

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.redirect(`${url.origin}${next}`);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headersToSet).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${url.origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Clear the transient post-auth redirect cookie (best-effort).
  response.cookies.set("ifxb_next", "", { path: "/", maxAge: 0 });
  return response;
}
