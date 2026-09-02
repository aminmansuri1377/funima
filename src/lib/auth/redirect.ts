import type { UserRole } from "@/generated/prisma/client";

export function getClientRedirectForRole(role: UserRole) {
  switch (role) {
    case "VISITOR":
      return "/";

    case "HOST":
      return "/host";

    case "ADMIN":
      return "/panel";
  }
}
