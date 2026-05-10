import { createAdminDbClient } from "@/lib/supabase/server";

export interface BookingPreviewData {
  id: string;
  status: string | null;
  payment_status: string | null;
  start_date: string | null;
  end_date: string | null;
  total_amount: number | null;
  owner_id: string | null;
  renter_id: string | null;
  car_id: string | null;
  car_name: string | null;
  car_plate: string | null;
  cover_photo_url: string | null;
}

interface CarPreviewData {
  id: string;
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
}

export async function getBookingPreviewData(
  bookingId: string
): Promise<BookingPreviewData | null> {
  const db = createAdminDbClient();
  const { data, error } = await db
    .from("bookings")
    .select(
      "id,status,payment_status,start_date,end_date,total_amount,owner_id,renter_id,car:cars(id,manufacturer,model,license_plate,car_photos(photo_url,is_cover))"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const car = data.car as
    | {
        id?: string;
        manufacturer?: string;
        model?: string;
        license_plate?: string;
        car_photos?: { photo_url?: string; is_cover?: boolean }[];
      }
    | null;

  const carPhotos = car?.car_photos ?? [];

  return {
    id: data.id,
    status: data.status,
    payment_status: data.payment_status,
    start_date: data.start_date,
    end_date: data.end_date,
    total_amount: data.total_amount,
    owner_id: data.owner_id,
    renter_id: data.renter_id,
    car_id: car?.id ?? null,
    car_name: car ? `${car.manufacturer ?? ""} ${car.model ?? ""}`.trim() : null,
    car_plate: car?.license_plate ?? null,
    cover_photo_url:
      carPhotos.find((photo) => photo?.is_cover)?.photo_url ??
      carPhotos[0]?.photo_url ??
      null,
  };
}

export async function getCarPreviewData(carId: string): Promise<CarPreviewData | null> {
  const db = createAdminDbClient();
  const { data, error } = await db
    .from("cars")
    .select(
      "id,manufacturer,model,year,transmission,fuel_type,category,pickup_city,daily_price,minimum_trip_days,description,license_plate,car_photos(photo_url,is_cover)"
    )
    .eq("id", carId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const photos = (data.car_photos as { photo_url?: string; is_cover?: boolean }[]) ?? [];

  return {
    id: data.id,
    name: `${data.manufacturer ?? ""} ${data.model ?? ""}`.trim(),
    year: data.year,
    transmission: data.transmission,
    fuel_type: data.fuel_type,
    category: data.category,
    pickup_city: data.pickup_city,
    daily_price: data.daily_price,
    minimum_trip_days: data.minimum_trip_days,
    description: data.description,
    license_plate: data.license_plate,
    cover_photo_url:
      photos.find((photo) => photo?.is_cover)?.photo_url ??
      photos[0]?.photo_url ??
      null,
  };
}
