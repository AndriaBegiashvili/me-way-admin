import { DashboardKpis } from "@/components/dashboard-kpis";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getDashboardMetrics, getSectionRows } from "@/lib/admin-data";
import { BookingsTable } from "@/components/sections/bookings-table";

export default async function DashboardPage() {
  const role = getCurrentAdminRole();
  const [metrics, latestBookings] = await Promise.all([
    getDashboardMetrics(),
    getSectionRows("bookings"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of platform activity — click any tile to jump to the relevant section.
        </p>
      </div>

      <DashboardKpis metrics={metrics} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Recent Bookings</h2>
          <a href="/bookings" className="text-xs text-indigo-600 hover:underline font-medium">
            View all →
          </a>
        </div>
        <BookingsTable rows={latestBookings.slice(0, 10) as never} role={role} />
      </div>
    </div>
  );
}
