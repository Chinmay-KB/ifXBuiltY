export type NavUser = {
  id: string;
  email?: string;
  avatar_url?: string;
  display_name?: string;
};

export function navUserFromAuthUser(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): NavUser {
  return {
    id: authUser.id,
    email: authUser.email ?? undefined,
    avatar_url:
      typeof authUser.user_metadata?.avatar_url === "string"
        ? authUser.user_metadata.avatar_url
        : undefined,
    display_name:
      (typeof authUser.user_metadata?.full_name === "string"
        ? authUser.user_metadata.full_name
        : undefined) ??
      (typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : undefined),
  };
}
