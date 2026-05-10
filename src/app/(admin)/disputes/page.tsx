import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getSectionRows } from "@/lib/admin-data";
import { DisputesTable } from "@/components/sections/disputes-table";

export default async function DisputesPage() {
  const [role, rows] = await Promise.all([
    Promise.resolve(getCurrentAdminRole()),
    getSectionRows("disputes"),
  ]);
  return <DisputesTable rows={rows as never} role={role} />;
}
