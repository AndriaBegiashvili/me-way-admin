import { Badge } from "@/components/ui/badge";
import type { BookingPreviewData } from "@/lib/booking-preview-data";

function formatDate(value: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value: number | null) {
  if (value == null) return "N/A";
  return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })} GEL`;
}

export function EmptyPreview({ title, id }: { title: string; id: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">No data found for id: {id}</p>
    </div>
  );
}

export function TripPreviewPage({ booking }: { booking: BookingPreviewData }) {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PreviewHeader title="Trip details" subtitle="Guest-facing preview in admin panel" booking={booking} />
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <CarHero booking={booking} />
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <InfoCard label="Trip starts" value={formatDate(booking.start_date)} />
          <InfoCard label="Trip ends" value={formatDate(booking.end_date)} />
          <InfoCard label="Total paid" value={formatAmount(booking.total_amount)} />
        </div>
      </div>
    </div>
  );
}

export function HostBookingPreviewPage({ booking }: { booking: BookingPreviewData }) {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <PreviewHeader title="Host booking view" subtitle="Host-facing booking layout" booking={booking} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
          <CarHero booking={booking} />
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoCard label="Check-in date" value={formatDate(booking.start_date)} />
            <InfoCard label="Check-out date" value={formatDate(booking.end_date)} />
            <InfoCard label="Guest id" value={booking.renter_id ?? "N/A"} />
            <InfoCard label="Host id" value={booking.owner_id ?? "N/A"} />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900">Earnings summary</p>
          <p className="mt-3 text-2xl font-bold text-gray-900">{formatAmount(booking.total_amount)}</p>
          <p className="mt-2 text-xs text-gray-500">Payment status</p>
          <div className="mt-1">
            <Badge status={booking.payment_status ?? "pending"} dot />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewHeader({
  title,
  subtitle,
  booking,
}: {
  title: string;
  subtitle: string;
  booking: BookingPreviewData;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge status={booking.status ?? "pending"} dot />
        <Badge status={booking.payment_status ?? "pending"} />
      </div>
    </div>
  );
}

function CarHero({ booking }: { booking: BookingPreviewData }) {
  return (
    <div className="flex gap-4">
      <div className="h-24 w-36 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {booking.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={booking.cover_photo_url} alt={booking.car_name ?? "Car"} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div>
        <p className="text-lg font-semibold text-gray-900">{booking.car_name ?? "Unknown car"}</p>
        <p className="text-sm text-gray-500">Plate: {booking.car_plate ?? "N/A"}</p>
        <p className="text-xs text-gray-400 mt-2">Booking: {booking.id}</p>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

export function CarListingPreviewPage({
  car,
}: {
  car: {
    name: string;
    year: number | null;
    transmission: string | null;
    fuel_type: string | null;
    category: string | null;
    pickup_city: string | null;
    daily_price: number | null;
    minimum_trip_days: number | null;
    description: string | null;
    license_plate: string | null;
    cover_photo_url: string | null;
  };
}) {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h1 className="text-lg font-semibold text-gray-900">Car listing view</h1>
        <p className="text-sm text-gray-500">Public listing style rendered inside admin panel</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="h-72 bg-gray-100">
          {car.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={car.cover_photo_url} alt={car.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {car.name} {car.year ? String(car.year) : ""}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {car.pickup_city ?? "City N/A"} · Plate {car.license_plate ?? "N/A"}
              </p>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatAmount(car.daily_price)}</p>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard label="Transmission" value={car.transmission ?? "N/A"} />
            <InfoCard label="Fuel" value={car.fuel_type ?? "N/A"} />
            <InfoCard label="Category" value={car.category ?? "N/A"} />
            <InfoCard label="Minimum days" value={String(car.minimum_trip_days ?? "N/A")} />
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-gray-900">Description</p>
            <p className="text-sm text-gray-600 mt-1">{car.description ?? "No description provided."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
