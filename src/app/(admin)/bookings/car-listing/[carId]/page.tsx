import { CarListingPreviewPage, EmptyPreview } from "@/components/booking-preview-pages";
import { getCarPreviewData } from "@/lib/booking-preview-data";

export default async function BookingCarListingPreviewPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const car = await getCarPreviewData(carId);

  if (!car) {
    return <EmptyPreview title="Car listing view" id={carId} />;
  }

  return <CarListingPreviewPage car={car} />;
}
