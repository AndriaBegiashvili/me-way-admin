import { EmptyPreview, TripPreviewPage } from "@/components/booking-preview-pages";
import { getBookingPreviewData } from "@/lib/booking-preview-data";

export default async function BookingTripPreviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = await getBookingPreviewData(bookingId);

  if (!booking) {
    return <EmptyPreview title="Trip details" id={bookingId} />;
  }

  return <TripPreviewPage booking={booking} />;
}
