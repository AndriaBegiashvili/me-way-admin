import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getSectionRows } from "@/lib/admin-data";
import { NotificationsTable } from "@/components/sections/notifications-table";

export default async function NotificationsLogPage() {
  const [role, rows] = await Promise.all([
    Promise.resolve(getCurrentAdminRole()),
    getSectionRows("notifications-log"),
  ]);
  return <NotificationsTable rows={rows as never} role={role} />;
}
