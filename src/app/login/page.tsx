import { redirect } from "next/navigation";

/**
 * The sign-in flow now uses an inline modal (SignInModal).
 * This page exists only as a fallback for direct links / bookmarks —
 * it redirects to the homepage where the modal can be triggered.
 */
export default function LoginPage() {
  redirect("/");
}
