import { createAdminDbClient } from "@/lib/supabase/server";
import { createMainAppUrl } from "@/lib/admin-links";

type UnknownRow = Record<string, unknown>;

export interface DashboardMetrics {
  pendingDocVerifications: number;
  activeBookings: number;
  openDisputes: number;
  revenueToday: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const db = createAdminDbClient();
    const today = new Date().toISOString().slice(0, 10);

    const [pendingDocs, activeBookings, openReports, paidToday] = await Promise.all([
      db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .not("id_photo_url", "is", null)
        .not("driver_license_url", "is", null),
      db
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("status", ["active", "confirmed", "pending"]),
      db
        .from("reports")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "reviewed"]),
      db
        .from("bookings")
        .select("total_amount")
        .eq("payment_status", "paid")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`),
    ]);

    return {
      pendingDocVerifications: pendingDocs.count ?? 0,
      activeBookings: activeBookings.count ?? 0,
      openDisputes: openReports.count ?? 0,
      revenueToday: (paidToday.data ?? []).reduce(
        (acc, row) => acc + Number(row.total_amount ?? 0),
        0
      ),
    };
  } catch (error) {
    console.error("[admin-data] failed to load dashboard metrics", error);
    return { pendingDocVerifications: 0, activeBookings: 0, openDisputes: 0, revenueToday: 0 };
  }
}

// Use select("*") everywhere to avoid failing on columns that may not exist
// in older DB versions (pre-031 migration). Missing columns simply won't appear
// in results rather than causing the entire query to error.

async function getCarsRows() {
  const db = createAdminDbClient();
  const { data, error } = await db
    .from("cars")
    .select("*, car_photos(photo_url, is_cover)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) console.error("[admin-data] cars:", error.message);
  return (data ?? []).map((row) => ({
    ...row,
    // Convenience aliases used by the table/edit modal
    car_display: `${row.manufacturer ?? ""} ${row.model ?? ""}`.trim(),
    plate: row.license_plate,
    city: row.pickup_city,
    cover_photo_url:
      (row.car_photos as { photo_url?: string; is_cover?: boolean }[] | undefined)?.find((p) => p?.is_cover)?.photo_url ??
      (row.car_photos as { photo_url?: string }[] | undefined)?.[0]?.photo_url ??
      null,
    photo_urls:
      ((row.car_photos as { photo_url?: string }[] | undefined) ?? [])
        .map((p) => p.photo_url)
        .filter(Boolean),
    admin_open_listing_url: createMainAppUrl(`/en/car/${row.id}`),
  }));
}

async function getUsersRows() {
  const db = createAdminDbClient();
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) console.error("[admin-data] users:", error.message);
  return (data ?? []).map((row) => ({
    ...row,
    name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Unknown",
    phone: `${row.phone_country ?? ""} ${row.phone_number ?? ""}`.trim(),
    docs_status:
      (row.docs_verification_status as string) ??
      (row.id_photo_url && row.driver_license_url ? "pending" : "missing"),
    privacy_violation_flag: (row.privacy_violation_flag as boolean) ?? false,
    account_status: (row.account_status as string) ?? "active",
    admin_open_profile_url: createMainAppUrl(`/en/profile/${row.id}`, row.id),
  }));
}

async function getBookingsRows() {
  const db = createAdminDbClient();
  // Attempt JOIN to get car and user names — if foreign key names differ, falls back below
  const { data, error } = await db
    .from("bookings")
    .select(
      `*, car:cars(id, manufacturer, model, license_plate, car_photos(photo_url, is_cover)), owner:profiles!bookings_owner_id_fkey(first_name, last_name, email), renter:profiles!bookings_renter_id_fkey(first_name, last_name, email)`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (!error && data) {
    return data.map((row) => {
      const car = row.car as Record<string, string> | null;
      const carPhotos = (row.car as { car_photos?: { photo_url?: string; is_cover?: boolean }[] } | null)?.car_photos ?? [];
      const owner = row.owner as Record<string, string> | null;
      const renter = row.renter as Record<string, string> | null;
      return {
        ...row,
        car_name: car ? `${car.manufacturer} ${car.model}` : null,
        car_public_id: car?.id ?? null,
        car_plate: car?.license_plate ?? null,
        cover_photo_url:
          carPhotos.find((p) => p?.is_cover)?.photo_url ??
          carPhotos[0]?.photo_url ??
          null,
        owner_name: owner ? `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim() : null,
        owner_email: owner?.email ?? null,
        renter_name: renter ? `${renter.first_name ?? ""} ${renter.last_name ?? ""}`.trim() : null,
        renter_email: renter?.email ?? null,
        admin_open_trip_url: createMainAppUrl(`/en/trips/${row.id}`, row.renter_id),
        admin_open_host_booking_url: createMainAppUrl(`/en/host/bookings/${row.id}`, row.owner_id),
        admin_open_car_url: car?.id ? createMainAppUrl(`/en/car/${car.id}`, row.renter_id) : null,
      };
    });
  }

  // Fallback: plain select without joins
  console.error("[admin-data] bookings join error:", error?.message, "— falling back to plain select");
  const { data: plain, error: e2 } = await db
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (e2) console.error("[admin-data] bookings fallback:", e2.message);
  return plain ?? [];
}

async function getPayoutRows() {
  const db = createAdminDbClient();
  const { data, error } = await db
    .from("payouts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!error && data) return data;

  // Payouts table may not exist yet — synthesize from paid bookings
  console.error("[admin-data] payouts:", error?.message, "— falling back to bookings");
  const { data: bookings, error: e2 } = await db
    .from("bookings")
    .select("id, owner_id, total_amount, payment_status, status, created_at")
    .eq("payment_status", "paid")
    .in("status", ["completed", "confirmed", "active"])
    .order("created_at", { ascending: false })
    .limit(200);
  if (e2) console.error("[admin-data] bookings fallback:", e2.message);
  return (bookings ?? []).map((row) => ({
    id: row.id,
    booking_id: row.id,
    host_id: row.owner_id,
    amount: row.total_amount,
    status: row.status === "completed" ? "pending" : "on_hold",
    payout_method: "n/a",
    created_at: row.created_at,
  }));
}

async function getDisputeRows() {
  const db = createAdminDbClient();
  const { data, error } = await db
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) console.error("[admin-data] disputes:", error.message);
  return (data ?? []).map((row) => ({
    ...row,
    dispute_id: row.id,
    booking_id: row.reported_booking_id,
    status: (row.deposit_flow_status as string) ?? (row.status as string) ?? "pending",
    claimed_amount: (row.claimed_amount as number) ?? 0,
  }));
}

async function getReviewsRows() {
  const db = createAdminDbClient();
  const { data, error } = await db
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) console.error("[admin-data] reviews:", error.message);
  return (data ?? []).map((row) => ({
    ...row,
    moderation_status: (row.moderation_status as string) ?? "visible",
  }));
}

async function getAuditRows() {
  const db = createAdminDbClient();
  const { data, error } = await db
    .from("admin_audit_log")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(200);
  if (!error && data) return data;

  console.error("[admin-data] audit_log:", error?.message);
  // Fallback to booking_admin_alerts if it exists
  const { data: fallback } = await db
    .from("booking_admin_alerts")
    .select("id, booking_id, alert_type, alert_payload, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return fallback ?? [];
}

async function getNotificationsRows() {
  const db = createAdminDbClient();
  const { data, error } = await db
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) console.error("[admin-data] notifications:", error.message);
  return (data ?? []).map((row) => ({
    ...row,
    channel: (row.channel as string) ?? "push",
    delivery_status: (row.delivery_status as string) ?? "delivered",
  }));
}

export async function getSectionRows(sectionKey: string): Promise<UnknownRow[]> {
  try {
    switch (sectionKey) {
      case "cars":
        return getCarsRows();
      case "users":
        return getUsersRows();
      case "bookings":
        return getBookingsRows();
      case "payouts":
        return getPayoutRows();
      case "disputes":
        return getDisputeRows();
      case "reviews":
        return getReviewsRows();
      case "audit-log":
        return getAuditRows();
      case "notifications-log":
        return getNotificationsRows();
      default:
        return [];
    }
  } catch (error) {
    console.error(`[admin-data] failed to load section ${sectionKey}`, error);
    return [];
  }
}
