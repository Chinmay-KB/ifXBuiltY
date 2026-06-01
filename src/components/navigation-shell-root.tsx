import { NavigationShellWrapper } from "@/components/navigation-shell-wrapper";
import { getServerNavSession } from "@/lib/nav-session";

/**
 * Server wrapper: hydrates nav with the same auth state the browser will see on first paint.
 */
export async function NavigationShellRoot() {
  const { user, isSuperadmin } = await getServerNavSession();

  return (
    <NavigationShellWrapper
      initialUser={user}
      initialIsSuperadmin={isSuperadmin}
    />
  );
}
