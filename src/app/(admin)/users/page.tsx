import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getSectionRows } from "@/lib/admin-data";
import { UsersTable } from "@/components/sections/users-table";

export default async function UsersPage() {
  const [role, rows] = await Promise.all([
    Promise.resolve(getCurrentAdminRole()),
    getSectionRows("users"),
  ]);
  return <UsersTable rows={rows as never} role={role} />;
}
