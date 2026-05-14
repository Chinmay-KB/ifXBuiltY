type NamedCookie = {
  name: string;
};

export function hasSupabaseAuthCookie(cookies: NamedCookie[]): boolean {
  return cookies.some(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
  );
}
