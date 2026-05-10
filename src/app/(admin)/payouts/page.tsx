import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getSectionRows } from "@/lib/admin-data";
import { PayoutsTable } from "@/components/sections/payouts-table";

export default async function PayoutsPage() {
  const [role, rows] = await Promise.all([
    Promise.resolve(getCurrentAdminRole()),
    getSectionRows("payouts"),
  ]);
  return <PayoutsTable rows={rows as never} role={role} />;
}
