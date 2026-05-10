import { EmptyPreview, HostBookingPreviewPage } from "@/components/booking-preview-pages";
import { getBookingPreviewData } from "@/lib/booking-preview-data";

export default async function BookingHostPreviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = await getBookingPreviewData(bookingId);

  if (!booking) {
    return <EmptyPreview title="Host booking view" id={bookingId} />;
  }

  return <HostBookingPreviewPage booking={booking} />;
}
