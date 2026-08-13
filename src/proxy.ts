import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  generationDetailSlugFromPathname,
  publishedGenerationPath,
  resolvePublishedSlugAliasRedirect,
} from "@/lib/published-slug-alias";
import { hasSupabaseAuthCookie } from "@/lib/supabase/auth-cookie";
import { tryGetSupabasePublicEnv } from "@/lib/supabase/public-env";

/**
 * HTTP 308 before any HTML. `permanentRedirect` in the page runs after
 * generateMetadata / the root layout have already started the document, so
 * crawlers that only read the status line saw 200 + "Not found" + noindex.
 */
async function publishedSlugAliasRedirect(
  request: NextRequest,
): Promise<NextResponse | null> {
  const slug = generationDetailSlugFromPathname(request.nextUrl.pathname);
  if (!slug) return null;

  const alias = await resolvePublishedSlugAliasRedirect(slug);
  if (!alias) return null;

  const url = request.nextUrl.clone();
  url.pathname = publishedGenerationPath(alias);
  return NextResponse.redirect(url, 308);
}

/**
 * Refreshes Supabase Auth cookies before render (Next.js 16+ proxy convention).
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function proxy(request: NextRequest) {
  const aliasRedirect = await publishedSlugAliasRedirect(request);
  if (aliasRedirect) return aliasRedirect;

  if (!hasSupabaseAuthCookie(request.cookies.getAll())) {
    return NextResponse.next({ request });
  }

  const env = tryGetSupabasePublicEnv();
  if (!env) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headersToSet).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/generations/|.well-known/workflow/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
