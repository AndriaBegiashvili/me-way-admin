"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Eye, EyeOff, CheckCircle, MoreHorizontal, ExternalLink } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AdminTable, type Column, SectionHeader, IDCell } from "@/components/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { updateCarStatus, updateCarFields, rejectCarWithReason } from "@/app/(admin)/actions";
import { cn } from "@/lib/cn";
import type { AdminRole } from "@/lib/types";

interface CarRow {
  id: string;
  car: string;
  plate: string;
  status: string;
  city: string;
  daily_price: number;
  mileage: number;
  owner_id: string;
  vin_code?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  year?: number | null;
  mileage_unit?: string | null;
  additional_info_georgian?: string | null;
  additional_info_english?: string | null;
  categories?: string[] | null;
  fuel_types?: string[] | null;
  seats?: number[] | null;
  additional_features?: string[] | null;
  steering_wheel?: "left" | "right" | null;
  drive_wheels?: "front" | "rear" | "4x4" | null;
  transmission?: "automatic" | "manual" | null;
  driver_required?: boolean | null;
  daily_price_currency?: "GEL" | "USD" | null;
  deposit_enabled?: boolean | null;
  deposit_amount?: number | null;
  deposit_currency?: "GEL" | "USD" | null;
  discount_enabled?: boolean | null;
  discount_days?: number | null;
  discount_unit?: "day" | "week" | null;
  discount_percentage?: number | null;
  any_period?: boolean | null;
  minimum_period_days?: number | null;
  minimum_period_unit?: "day" | "week" | null;
  minimum_age?: number | null;
  minimum_age_enabled?: boolean | null;
  buffer_period_hours?: number | null;
  pickup_address?: string | null;
  pickup_delivery_enabled?: boolean | null;
  pickup_delivery_city?: string | null;
  pickup_delivery_price?: number | null;
  pickup_delivery_currency?: "GEL" | "USD" | null;
  return_city?: string | null;
  return_address?: string | null;
  return_delivery_enabled?: boolean | null;
  return_delivery_city?: string | null;
  return_delivery_price?: number | null;
  return_delivery_currency?: "GEL" | "USD" | null;
  cover_photo_url?: string | null;
  photo_urls?: string[] | null;
}

function ReviewCarModal({
  car,
  open,
  onClose,
  onApprove,
  onReject,
  loading,
}: {
  car: CarRow;
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const photoUrls = (car.photo_urls ?? []).filter(Boolean);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`Review Listing — ${car.car}`} description={`Status: ${car.status ?? "pending"}`} size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-sm">
          <div className="grid grid-cols-2 gap-3">
            {photoUrls.length > 0 ? (
              photoUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${car.car} ${idx + 1}`} className="h-36 w-full object-cover" />
                </div>
              ))
            ) : (
              <div className="text-gray-400">No images uploaded.</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500">VIN:</span> {car.vin_code || "—"}</div>
            <div><span className="text-gray-500">Plate:</span> {car.plate || "—"}</div>
            <div><span className="text-gray-500">Car:</span> {car.car || "—"}</div>
            <div><span className="text-gray-500">Year:</span> {car.year ?? "—"}</div>
            <div><span className="text-gray-500">Mileage:</span> {car.mileage ?? "—"} {car.mileage_unit ?? ""}</div>
            <div><span className="text-gray-500">Transmission:</span> {car.transmission || "—"}</div>
            <div><span className="text-gray-500">Drive:</span> {car.drive_wheels || "—"}</div>
            <div><span className="text-gray-500">Steering:</span> {car.steering_wheel || "—"}</div>
            <div><span className="text-gray-500">Price:</span> {car.daily_price ?? "—"} {car.daily_price_currency ?? "GEL"}</div>
            <div><span className="text-gray-500">Seats:</span> {(car.seats ?? []).join(", ") || "—"}</div>
            <div><span className="text-gray-500">Fuel:</span> {(car.fuel_types ?? []).join(", ") || "—"}</div>
            <div><span className="text-gray-500">Categories:</span> {(car.categories ?? []).join(", ") || "—"}</div>
            <div><span className="text-gray-500">Features:</span> {(car.additional_features ?? []).join(", ") || "—"}</div>
            <div><span className="text-gray-500">Pickup:</span> {[car.city, car.pickup_address].filter(Boolean).join(" / ") || "—"}</div>
            <div><span className="text-gray-500">Return:</span> {[car.return_city, car.return_address].filter(Boolean).join(" / ") || "—"}</div>
          </div>

          <div>
            <p className="text-gray-500 mb-1">Description (English)</p>
            <p className="text-gray-700 whitespace-pre-wrap">{car.additional_info_english || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Description (Georgian)</p>
            <p className="text-gray-700 whitespace-pre-wrap">{car.additional_info_georgian || "—"}</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Close
            </Button>
            <Button variant="danger" size="sm" type="button" onClick={onReject} loading={loading}>
              Reject
            </Button>
            <Button variant="primary" size="sm" type="button" onClick={onApprove} loading={loading}>
              Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditCarModal({ car, open, onClose }: { car: CarRow; open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleFields(fd: FormData) {
    startTransition(async () => {
      await updateCarFields(fd);
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`Edit Car — ${car.car}`} description={`Plate: ${car.plate}`} size="lg">
        <form action={handleFields} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <input type="hidden" name="id" value={car.id} />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Input label="VIN" name="vin_code" defaultValue={car.vin_code ?? ""} />
            <Input label="Plate" name="license_plate" defaultValue={car.plate ?? ""} />
            <Input label="Manufacturer" name="manufacturer" defaultValue={car.manufacturer ?? ""} />
            <Input label="Model" name="model" defaultValue={car.model ?? ""} />
            <Input label="Year" name="year" type="number" defaultValue={car.year ?? ""} />
            <Input label="Mileage" name="mileage" type="number" defaultValue={car.mileage ?? ""} />
            <Select label="Mileage Unit" name="mileage_unit" defaultValue={car.mileage_unit ?? "km"}>
              <option value="km">km</option>
              <option value="mile">mile</option>
            </Select>
            <Select label="Transmission" name="transmission" defaultValue={car.transmission ?? ""}>
              <option value="">No change</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </Select>
            <Select label="Steering" name="steering_wheel" defaultValue={car.steering_wheel ?? ""}>
              <option value="">No change</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </Select>
            <Select label="Drive Wheels" name="drive_wheels" defaultValue={car.drive_wheels ?? ""}>
              <option value="">No change</option>
              <option value="front">Front</option>
              <option value="rear">Rear</option>
              <option value="4x4">4x4</option>
            </Select>
            <Input label="Daily Price" name="daily_price" type="number" step="0.01" defaultValue={car.daily_price ?? ""} />
            <Select label="Price Currency" name="daily_price_currency" defaultValue={car.daily_price_currency ?? "GEL"}>
              <option value="GEL">GEL</option>
              <option value="USD">USD</option>
            </Select>
            <Select label="Driver Required" name="driver_required" defaultValue={String(Boolean(car.driver_required))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
            <Select label="Deposit Enabled" name="deposit_enabled" defaultValue={String(Boolean(car.deposit_enabled))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
            <Input label="Deposit Amount" name="deposit_amount" type="number" step="0.01" defaultValue={car.deposit_amount ?? ""} />
            <Select label="Deposit Currency" name="deposit_currency" defaultValue={car.deposit_currency ?? "GEL"}>
              <option value="">None</option>
              <option value="GEL">GEL</option>
              <option value="USD">USD</option>
            </Select>
            <Select label="Discount Enabled" name="discount_enabled" defaultValue={String(Boolean(car.discount_enabled))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
            <Input label="Discount Days" name="discount_days" type="number" defaultValue={car.discount_days ?? ""} />
            <Select label="Discount Unit" name="discount_unit" defaultValue={car.discount_unit ?? "day"}>
              <option value="">None</option>
              <option value="day">Day</option>
              <option value="week">Week</option>
            </Select>
            <Input label="Discount %" name="discount_percentage" type="number" step="0.01" defaultValue={car.discount_percentage ?? ""} />
            <Select label="Any Period" name="any_period" defaultValue={String(car.any_period ?? true)}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
            <Input label="Minimum Period Days" name="minimum_period_days" type="number" defaultValue={car.minimum_period_days ?? ""} />
            <Select label="Minimum Period Unit" name="minimum_period_unit" defaultValue={car.minimum_period_unit ?? "day"}>
              <option value="">None</option>
              <option value="day">Day</option>
              <option value="week">Week</option>
            </Select>
            <Select label="Minimum Age Enabled" name="minimum_age_enabled" defaultValue={String(Boolean(car.minimum_age_enabled))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
            <Input label="Minimum Age" name="minimum_age" type="number" defaultValue={car.minimum_age ?? ""} />
            <Input label="Buffer (hours)" name="buffer_period_hours" type="number" step="0.5" defaultValue={car.buffer_period_hours ?? ""} />
            <Input label="Pickup City" name="pickup_city" defaultValue={car.city ?? ""} />
            <Input label="Pickup Address" name="pickup_address" defaultValue={car.pickup_address ?? ""} />
            <Select label="Pickup Delivery Enabled" name="pickup_delivery_enabled" defaultValue={String(Boolean(car.pickup_delivery_enabled))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
            <Input label="Pickup Delivery City" name="pickup_delivery_city" defaultValue={car.pickup_delivery_city ?? ""} />
            <Input label="Pickup Delivery Price" name="pickup_delivery_price" type="number" step="0.01" defaultValue={car.pickup_delivery_price ?? ""} />
            <Select label="Pickup Delivery Currency" name="pickup_delivery_currency" defaultValue={car.pickup_delivery_currency ?? "GEL"}>
              <option value="">None</option>
              <option value="GEL">GEL</option>
              <option value="USD">USD</option>
            </Select>
            <Input label="Return City" name="return_city" defaultValue={car.return_city ?? ""} />
            <Input label="Return Address" name="return_address" defaultValue={car.return_address ?? ""} />
            <Select label="Return Delivery Enabled" name="return_delivery_enabled" defaultValue={String(Boolean(car.return_delivery_enabled))}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
            <Input label="Return Delivery City" name="return_delivery_city" defaultValue={car.return_delivery_city ?? ""} />
            <Input label="Return Delivery Price" name="return_delivery_price" type="number" step="0.01" defaultValue={car.return_delivery_price ?? ""} />
            <Select label="Return Delivery Currency" name="return_delivery_currency" defaultValue={car.return_delivery_currency ?? "GEL"}>
              <option value="">None</option>
              <option value="GEL">GEL</option>
              <option value="USD">USD</option>
            </Select>
          </div>
          <Input label="Categories (comma-separated)" name="categories" defaultValue={(car.categories ?? []).join(", ")} />
          <Input label="Fuel Types (comma-separated)" name="fuel_types" defaultValue={(car.fuel_types ?? []).join(", ")} />
          <Input label="Seats (comma-separated numbers)" name="seats" defaultValue={(car.seats ?? []).join(", ")} />
          <Input label="Additional Features (comma-separated)" name="additional_features" defaultValue={(car.additional_features ?? []).join(", ")} />
          <Textarea label="Info (Georgian)" name="additional_info_georgian" rows={3} defaultValue={car.additional_info_georgian ?? ""} />
          <Textarea label="Info (English)" name="additional_info_english" rows={3} defaultValue={car.additional_info_english ?? ""} />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CarActions({ row, role }: { row: CarRow; role: AdminRole }) {
  const [editOpen, setEditOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isReadOnly = role !== "full_access";

  function setStatus(status: string) {
    if (status === "rejected") {
      setDropOpen(false);
      setRejectOpen(true);
      return;
    }

    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("status", status);
    startTransition(async () => {
      await updateCarStatus(fd);
      router.refresh();
      setDropOpen(false);
    });
  }

  function rejectWithReason() {
    if (!rejectionReason.trim()) return;
    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("rejection_reason", rejectionReason.trim());
    startTransition(async () => {
      await rejectCarWithReason(fd);
      router.refresh();
      setRejectOpen(false);
      setRejectionReason("");
    });
  }

  if (isReadOnly) {
    return <span className="text-xs text-gray-400 italic">Read-only</span>;
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setReviewOpen(true)}>
        <Eye size={12} />
        Review
      </Button>
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil size={12} />
        Edit
      </Button>

      <DropdownMenu.Root open={dropOpen} onOpenChange={setDropOpen}>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal size={15} />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-44 bg-white rounded-xl border border-gray-100 shadow-lg py-1 text-sm"
            sideOffset={4}
            align="end"
          >
            <DropdownMenu.Label className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Status
            </DropdownMenu.Label>
            {[
              { value: "active", label: "Publish (Active)", icon: CheckCircle, color: "text-green-600" },
              { value: "inactive", label: "Hide (Inactive)", icon: EyeOff, color: "text-gray-500" },
              { value: "rejected", label: "Reject", icon: Eye, color: "text-red-500" },
              { value: "pending", label: "Back to Pending", icon: Eye, color: "text-amber-600" },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <DropdownMenu.Item
                  key={opt.value}
                  onSelect={() => setStatus(opt.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 cursor-pointer outline-none",
                    "hover:bg-gray-50 transition-colors",
                    opt.color
                  )}
                >
                  <Icon size={13} />
                  {opt.label}
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <EditCarModal car={row} open={editOpen} onClose={() => setEditOpen(false)} />
      <ReviewCarModal
        car={row}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onApprove={() => setStatus("active")}
        onReject={() => {
          setReviewOpen(false);
          setRejectOpen(true);
        }}
        loading={isPending}
      />
      <Dialog open={rejectOpen} onOpenChange={(o) => !o && setRejectOpen(false)}>
        <DialogContent
          title={`Reject Car — ${row.car}`}
          description="Write a custom reason. This will be sent to the owner as chat message and notification."
          size="md"
        >
          <div className="space-y-4">
            <Textarea
              label="Rejection message"
              rows={5}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain exactly why this listing was rejected."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)} type="button">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={rejectWithReason}
                loading={isPending}
                disabled={!rejectionReason.trim()}
                type="button"
              >
                Reject and notify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const columns: Column<CarRow>[] = [
  {
    key: "car",
    header: "Car",
    render: (row) => (
      <div className="flex items-center gap-2">
        <div className="h-10 w-14 rounded-md overflow-hidden bg-gray-100 shrink-0">
          {row.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.cover_photo_url} alt={row.car} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.car}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{row.plate}</p>
        </div>
      </div>
    ),
  },
  {
    key: "links",
    header: "Public Links",
    render: (row) => (
      <div className="flex flex-col gap-1 text-xs">
        <a
          href={row.admin_open_listing_url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
        >
          Listing <ExternalLink size={11} />
        </a>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "100px",
    render: (row) => <Badge status={row.status ?? "pending"} dot />,
  },
  {
    key: "city",
    header: "City",
    render: (row) => <span className="text-gray-600">{row.city || <span className="text-gray-400">—</span>}</span>,
  },
  {
    key: "daily_price",
    header: "Daily Price",
    render: (row) => (
      <span className="font-medium tabular-nums">
        {row.daily_price ? `${Number(row.daily_price).toFixed(0)} GEL` : <span className="text-gray-400">—</span>}
      </span>
    ),
  },
  {
    key: "mileage",
    header: "Mileage (km)",
    render: (row) => <span className="tabular-nums text-gray-600">{row.mileage ?? <span className="text-gray-400">—</span>}</span>,
  },
  {
    key: "owner_id",
    header: "Owner ID",
    render: (row) => <IDCell value={String(row.owner_id)} />,
  },
];

export function CarsTable({ rows, role }: { rows: CarRow[]; role: AdminRole }) {
  return (
    <div>
      <SectionHeader
        title="Cars"
        description="Manage listings — edit fields, publish, hide, or reject cars."
      />
      <AdminTable
        columns={columns}
        rows={rows}
        renderActions={(row) => <CarActions row={row} role={role} />}
        searchFn={(row, q) =>
          row.car.toLowerCase().includes(q) ||
          String(row.plate ?? "").toLowerCase().includes(q) ||
          String(row.city ?? "").toLowerCase().includes(q)
        }
        statusOptions={[
          { value: "pending", label: "Pending moderation" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
          { value: "rejected", label: "Rejected" },
          { value: "approved", label: "Approved" },
        ]}
        statusKey="status"
        emptyMessage="No cars found in the database."
      />
    </div>
  );
}
