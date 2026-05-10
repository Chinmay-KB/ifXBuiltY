/** The single superadmin email that has access to the admin panel. */
export const SUPERADMIN_EMAIL = "chinmaykabi@gmail.com";

/** Returns true if the given email matches the configured superadmin. */
export function isSuperadmin(email: string | undefined | null): boolean {
  return email === SUPERADMIN_EMAIL;
}
