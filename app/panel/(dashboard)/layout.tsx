import type { ReactNode } from "react";

import { AdminShell } from "@/components/panel/admin-shell";

export default function PanelDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
