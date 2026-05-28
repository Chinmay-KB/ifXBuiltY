import type { User } from "@supabase/supabase-js";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

function resolveDisplayName(user: User): string | null {
  const meta = user.user_metadata as
    | {
        full_name?: unknown;
        name?: unknown;
        preferred_username?: unknown;
        user_name?: unknown;
      }
    | null
    | undefined;

  const raw =
    (typeof meta?.full_name === "string" ? meta.full_name : "") ||
    (typeof meta?.name === "string" ? meta.name : "") ||
    (typeof meta?.preferred_username === "string" ? meta.preferred_username : "") ||
    (typeof meta?.user_name === "string" ? meta.user_name : "") ||
    "";

  const trimmed = raw.trim();
  if (trimmed) return trimmed;

  const email = user.email?.trim();
  if (email) return email.split("@")[0] || null;

  return null;
}

function resolveAvatarUrl(user: User): string | null {
  const meta = user.user_metadata as
    | {
        avatar_url?: unknown;
        picture?: unknown;
      }
    | null
    | undefined;

  const raw =
    (typeof meta?.avatar_url === "string" ? meta.avatar_url : "") ||
    (typeof meta?.picture === "string" ? meta.picture : "") ||
    "";

  const trimmed = raw.trim();
  return trimmed || null;
}

/**
 * Upserts public profile fields for a Supabase user.
 * Safe to call on every sign-in.
 */
export async function ensureProfileForUser(user: User): Promise<void> {
  let service: ReturnType<typeof createSupabaseServiceClient>;
  try {
    service = createSupabaseServiceClient();
  } catch {
    return;
  }

  const displayName = resolveDisplayName(user);
  const avatarUrl = resolveAvatarUrl(user);

  await service.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
    },
    { onConflict: "id" },
  );
}

