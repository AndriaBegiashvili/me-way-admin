import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getSectionRows } from "@/lib/admin-data";
import { BookingsTable } from "@/components/sections/bookings-table";

export default async function BookingsPage() {
  const [role, rows] = await Promise.all([
    Promise.resolve(getCurrentAdminRole()),
    getSectionRows("bookings"),
  ]);
  return <BookingsTable rows={rows as never} role={role} />;
}
