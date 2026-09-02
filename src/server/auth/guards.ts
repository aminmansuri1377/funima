import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getRoleHome } from "@/lib/auth/routes";

export async function redirectAuthenticatedUser() {
  const session = await auth();

  const activeRole = session?.user?.activeRole;

  if (activeRole) {
    redirect(getRoleHome(activeRole));
  }
}
