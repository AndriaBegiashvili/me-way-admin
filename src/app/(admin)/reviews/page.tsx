import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getSectionRows } from "@/lib/admin-data";
import { ReviewsTable } from "@/components/sections/reviews-table";

export default async function ReviewsPage() {
  const [role, rows] = await Promise.all([
    Promise.resolve(getCurrentAdminRole()),
    getSectionRows("reviews"),
  ]);
  return <ReviewsTable rows={rows as never} role={role} />;
}
