import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin-shell";
import { getCurrentAdminRole } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const role = getCurrentAdminRole();
  return <AdminShell role={role}>{children}</AdminShell>;
}
