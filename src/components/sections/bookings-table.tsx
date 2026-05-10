"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, RefreshCw, CalendarDays, DollarSign, MapPin, AlertTriangle, ExternalLink } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AdminTable, type Column, SectionHeader, DateCell, MoneyCell, IDCell } from "@/components/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  updateBookingPayment,
  updateBookingDates,
  updateBookingPriceAndLateFee,
  issueBookingRefund,
  cancelBookingTechnicalError,
  flagTerritorialViolation,
} from "@/app/(admin)/actions";
import type { AdminRole } from "@/lib/types";

interface BookingRow {
  id: string;
  status: string;
  payment_status: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  owner_id: string;
  renter_id: string;
  confirmation_deadline: string;
  late_fee_tier: string;
  late_fee_amount: number;
  refund_amount: number;
  refund_reason_code: string;
  territorial_violation_flag: boolean;
  car_id?: string | null;
  car_name?: string | null;
  car_plate?: string | null;
  cover_photo_url?: string | null;
  admin_open_trip_url?: string | null;
  admin_open_host_booking_url?: string | null;
  admin_open_car_url?: string | null;
}

function EditDatesModal({ booking, open, onClose }: { booking: BookingRow; open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Override Booking Dates" description="Use a calendar picker to change start/end dates." size="sm">
        <form
          action={async (fd) => {
            startTransition(async () => {
              await updateBookingDates(fd);
              router.refresh();
              onClose();
            });
          }}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={booking.id} />
          <Input label="Start date" name="start_date" type="date" defaultValue={booking.start_date?.slice(0, 10)} />
          <Input label="End date" name="end_date" type="date" defaultValue={booking.end_date?.slice(0, 10)} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" loading={isPending}>Override dates</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RefundModal({ booking, open, onClose }: { booking: BookingRow; open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Issue Refund" description={`Booking ${booking.id?.slice(0, 8)}`} size="sm">
        <form
          action={async (fd) => {
            startTransition(async () => {
              await issueBookingRefund(fd);
              router.refresh();
              onClose();
            });
          }}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={booking.id} />
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p>Total booking amount: <strong>{Number(booking.total_amount ?? 0).toFixed(2)} GEL</strong></p>
          </div>
          <Input label="Refund amount (GEL)" name="refund_amount" type="number" step="0.01" placeholder="Enter amount" />
          <Select label="Reason code" name="refund_reason_code">
            <option value="">Select reason…</option>
            <option value="guest_cancellation_24h">Guest cancellation (24h+, full refund)</option>
            <option value="host_cancellation">Host cancellation (force majeure)</option>
            <option value="technical_error">Technical / pricing error</option>
            <option value="dispute_resolution">Dispute resolution</option>
            <option value="admin_discretion">Admin discretion</option>
            <option value="other">Other</option>
          </Select>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="danger" size="sm" type="submit" loading={isPending}>Issue refund</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TerritorialModal({ booking, open, onClose }: { booking: BookingRow; open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Flag Territorial Violation" description="§4.2 — Unauthorized territory" size="sm">
        <form
          action={async (fd) => {
            startTransition(async () => {
              await flagTerritorialViolation(fd);
              router.refresh();
              onClose();
            });
          }}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={booking.id} />
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
            <p className="font-medium">Territorial violation (§4.2)</p>
            <p className="mt-1 text-xs">Guest reported for taking the car outside Georgia or into occupied territories.</p>
          </div>
          <Textarea
            label="Violation notes"
            name="territorial_violation_notes"
            rows={3}
            placeholder="Describe the violation and any evidence…"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="danger" size="sm" type="submit" loading={isPending}>Flag & escalate</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BookingActions({ row, role }: { row: BookingRow; role: AdminRole }) {
  const [datesOpen, setDatesOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [territorialOpen, setTerritorialOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isReadOnly = role !== "full_access";

  if (isReadOnly) return <span className="text-xs text-gray-400 italic">Read-only</span>;

  function setPayment(status: string) {
    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("payment_status", status);
    startTransition(async () => {
      await updateBookingPayment(fd);
      router.refresh();
      setDropOpen(false);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDatesOpen(true)}>
        <CalendarDays size={12} />
        Dates
      </Button>
      <Button variant="outline" size="sm" onClick={() => setRefundOpen(true)}>
        <RefreshCw size={12} />
        Refund
      </Button>

      <DropdownMenu.Root open={dropOpen} onOpenChange={setDropOpen}>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal size={15} />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 text-sm"
            sideOffset={4}
            align="end"
          >
            <DropdownMenu.Label className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Payment
            </DropdownMenu.Label>
            {[
              { value: "paid", label: "Mark as Paid" },
              { value: "pending", label: "Mark as Pending" },
              { value: "refunded", label: "Mark as Refunded" },
            ].map((opt) => (
              <DropdownMenu.Item
                key={opt.value}
                onSelect={() => setPayment(opt.value)}
                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer outline-none hover:bg-gray-50 text-gray-700"
              >
                <DollarSign size={12} className="text-gray-400" />
                {opt.label}
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
            <DropdownMenu.Item
              onSelect={() => { setDropOpen(false); setTerritorialOpen(true); }}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer outline-none hover:bg-amber-50 text-amber-700"
            >
              <MapPin size={12} />
              Flag territorial violation
            </DropdownMenu.Item>
            <DropdownMenu.Item className="outline-none">
              <ConfirmDialog
                trigger={
                  <button className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-red-600 hover:bg-red-50 cursor-pointer">
                    <AlertTriangle size={12} />
                    Cancel + Full refund (technical)
                  </button>
                }
                title="Cancel booking due to technical error?"
                description="This will cancel the booking and issue a full refund. Use only for platform pricing errors (§3.1)."
                confirmLabel="Cancel + Refund"
                action={cancelBookingTechnicalError}
                formData={{ id: row.id }}
              />
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <EditDatesModal booking={row} open={datesOpen} onClose={() => setDatesOpen(false)} />
      <RefundModal booking={row} open={refundOpen} onClose={() => setRefundOpen(false)} />
      <TerritorialModal booking={row} open={territorialOpen} onClose={() => setTerritorialOpen(false)} />
    </>
  );
}

const columns: Column<BookingRow>[] = [
  {
    key: "car",
    header: "Car",
    render: (row) => (
      <div className="flex items-center gap-2">
        <div className="h-10 w-14 rounded-md overflow-hidden bg-gray-100 shrink-0">
          {row.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.cover_photo_url} alt={row.car_name ?? "Car"} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div>
          <p className="font-medium text-gray-900">{row.car_name ?? "—"}</p>
          <p className="text-xs text-gray-400">{row.car_plate ?? "—"}</p>
        </div>
      </div>
    ),
  },
  {
    key: "id",
    header: "Booking ID",
    render: (row) => <IDCell value={row.id} />,
  },
  {
    key: "participants",
    header: "Participants",
    render: (row) => (
      <div className="text-xs space-y-0.5">
        <p><span className="text-gray-400">Host:</span> <IDCell value={row.owner_id} /></p>
        <p><span className="text-gray-400">Guest:</span> <IDCell value={row.renter_id} /></p>
      </div>
    ),
  },
  {
    key: "period",
    header: "Period",
    render: (row) => (
      <div className="text-xs text-gray-600">
        <p>{row.start_date?.slice(0, 10) ?? "—"}</p>
        <p className="text-gray-400">→ {row.end_date?.slice(0, 10) ?? "—"}</p>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "110px",
    render: (row) => <Badge status={row.status ?? "pending"} dot />,
  },
  {
    key: "payment_status",
    header: "Payment",
    width: "110px",
    render: (row) => (
      <div className="space-y-1">
        <Badge status={row.payment_status ?? "pending"} dot />
        {row.territorial_violation_flag && (
          <span className="flex items-center gap-1 text-[10px] text-amber-600">
            <MapPin size={10} />
            Territory flag
          </span>
        )}
      </div>
    ),
  },
  {
    key: "total_amount",
    header: "Total",
    render: (row) => <MoneyCell value={row.total_amount} />,
  },
  {
    key: "links",
    header: "Public Links",
    render: (row) => (
      <div className="flex flex-col gap-1 text-xs">
        <Link
          href={row.admin_open_trip_url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
        >
          Trip <ExternalLink size={11} />
        </Link>
        <Link
          href={row.admin_open_host_booking_url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
        >
          Host booking <ExternalLink size={11} />
        </Link>
        {row.admin_open_car_url ? (
          <Link
            href={row.admin_open_car_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
          >
            Car listing <ExternalLink size={11} />
          </Link>
        ) : null}
      </div>
    ),
  },
  {
    key: "created_at",
    header: "Created",
    render: (row) => <DateCell value={(row as unknown as Record<string, string>).created_at} />,
  },
];

export function BookingsTable({ rows, role }: { rows: BookingRow[]; role: AdminRole }) {
  return (
    <div>
      <SectionHeader
        title="Bookings"
        description="Override dates, manage payments, issue refunds, and flag violations."
      />
      <AdminTable
        columns={columns}
        rows={rows}
        renderActions={(row) => <BookingActions row={row} role={role} />}
        searchFn={(row, q) =>
          row.id.toLowerCase().includes(q) ||
          String(row.owner_id ?? "").toLowerCase().includes(q) ||
          String(row.renter_id ?? "").toLowerCase().includes(q)
        }
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "confirmed", label: "Confirmed" },
          { value: "pending", label: "Pending" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ]}
        statusKey="status"
        emptyMessage="No bookings found."
      />
    </div>
  );
}
