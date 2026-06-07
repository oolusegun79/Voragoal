import { auth } from "@/server/auth/config";
import { userHasPass } from "@/server/auth/access";
import { DismissibleBanner } from "./DismissibleBanner";

export async function UpgradeBanner() {
  const session = await auth();
  if (!session?.user?.id) return null;

  let hasPass = false;
  try {
    hasPass = await userHasPass(session.user.id);
  } catch {
    return null;
  }
  if (hasPass) return null;

  return <DismissibleBanner />;
}
