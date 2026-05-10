import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getSectionRows } from "@/lib/admin-data";
import { CarsTable } from "@/components/sections/cars-table";

export default async function CarsPage() {
  const [role, rows] = await Promise.all([
    Promise.resolve(getCurrentAdminRole()),
    getSectionRows("cars"),
  ]);
  return <CarsTable rows={rows as never} role={role} />;
}
