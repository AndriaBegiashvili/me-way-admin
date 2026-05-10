"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, PauseCircle, PlayCircle, MoreHorizontal } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AdminTable, type Column, SectionHeader, DateCell, MoneyCell, IDCell } from "@/components/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { updatePayoutStatus } from "@/app/(admin)/actions";
import { cn } from "@/lib/cn";
import type { AdminRole } from "@/lib/types";

interface PayoutRow {
  id: string;
  booking_id: string;
  host_id: string;
  amount: number;
  status: string;
  payout_method: string;
  hold_reason?: string;
  created_at?: string;
}

function PayoutActionModal({ payout, open, onClose }: { payout: PayoutRow; open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [status, setStatus] = useState(payout.status);
  const [holdReason, setHoldReason] = useState(payout.hold_reason ?? "");

  function handleSubmit() {
    const fd = new FormData();
    fd.append("id", payout.id);
    fd.append("status", status);
    fd.append("hold_reason", holdReason);
    startTransition(async () => {
      await updatePayoutStatus(fd);
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Manage Payout" description={`Amount: ${Number(payout.amount ?? 0).toFixed(2)} GEL`} size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div><span className="text-gray-400">Booking:</span> <IDCell value={payout.booking_id} /></div>
              <div><span className="text-gray-400">Host:</span> <IDCell value={payout.host_id} /></div>
              <div><span className="text-gray-400">Method:</span> {payout.payout_method ?? "—"}</div>
              <div><span className="text-gray-400">Current:</span> <Badge status={payout.status} /></div>
            </div>
          </div>
          <Select label="New status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="on_hold">On Hold</option>
          </Select>
          {status === "on_hold" && (
            <Input
              label="Hold reason"
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              placeholder="e.g. Linked dispute open"
            />
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" loading={isPending} onClick={handleSubmit}>Update payout</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PayoutActions({ row, role }: { row: PayoutRow; role: AdminRole }) {
  const [editOpen, setEditOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isReadOnly = role !== "full_access";

  if (isReadOnly) return <span className="text-xs text-gray-400 italic">Read-only</span>;

  function quickStatus(status: string) {
    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("status", status);
    startTransition(async () => {
      await updatePayoutStatus(fd);
      router.refresh();
      setDropOpen(false);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        Manage
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
            <DropdownMenu.Item
              onSelect={() => quickStatus("sent")}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer outline-none hover:bg-green-50 text-green-700"
            >
              <Send size={12} />
              Send payout
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => quickStatus("on_hold")}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer outline-none hover:bg-amber-50 text-amber-700"
            >
              <PauseCircle size={12} />
              Hold payout
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => quickStatus("pending")}
              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer outline-none hover:bg-gray-50 text-gray-700"
            >
              <PlayCircle size={12} />
              Release hold
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <PayoutActionModal payout={row} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}

const columns: Column<PayoutRow>[] = [
  {
    key: "id",
    header: "Payout ID",
    render: (row) => <IDCell value={row.id} />,
  },
  {
    key: "host_id",
    header: "Host",
    render: (row) => <IDCell value={row.host_id} />,
  },
  {
    key: "booking_id",
    header: "Booking",
    render: (row) => <IDCell value={row.booking_id} />,
  },
  {
    key: "amount",
    header: "Amount",
    render: (row) => <MoneyCell value={row.amount} />,
  },
  {
    key: "status",
    header: "Status",
    width: "120px",
    render: (row) => (
      <div>
        <Badge status={row.status ?? "pending"} dot />
        {row.hold_reason && (
          <p className="text-[10px] text-gray-400 mt-0.5 max-w-28 truncate" title={row.hold_reason}>
            {row.hold_reason}
          </p>
        )}
      </div>
    ),
  },
  {
    key: "payout_method",
    header: "Method",
    render: (row) => (
      <span className="text-xs text-gray-500 capitalize">{row.payout_method ?? <span className="text-gray-400">—</span>}</span>
    ),
  },
  {
    key: "created_at",
    header: "Date",
    render: (row) => <DateCell value={row.created_at} />,
  },
];

export function PayoutsTable({ rows, role }: { rows: PayoutRow[]; role: AdminRole }) {
  return (
    <div>
      <SectionHeader
        title="Payouts"
        description="Manage host payouts. Dispute-linked payouts are auto-held until resolved (§6.1)."
      />
      <AdminTable
        columns={columns}
        rows={rows}
        renderActions={(row) => <PayoutActions row={row} role={role} />}
        searchFn={(row, q) =>
          row.id.toLowerCase().includes(q) ||
          String(row.host_id ?? "").toLowerCase().includes(q) ||
          String(row.booking_id ?? "").toLowerCase().includes(q)
        }
        statusOptions={[
          { value: "pending", label: "Pending" },
          { value: "sent", label: "Sent" },
          { value: "failed", label: "Failed" },
          { value: "on_hold", label: "On Hold" },
        ]}
        statusKey="status"
        dateKey="created_at"
        emptyMessage="No payouts found."
      />
    </div>
  );
}
