"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gavel } from "lucide-react";
import { AdminTable, type Column, SectionHeader, MoneyCell, IDCell, DateCell } from "@/components/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, Textarea, Input } from "@/components/ui/input";
import { updateDisputeStatus } from "@/app/(admin)/actions";
import type { AdminRole } from "@/lib/types";

interface DisputeRow {
  dispute_id: string;
  booking_id: string;
  reason: string;
  status: string;
  reporter_id: string;
  reported_user_id: string;
  claimed_amount: number;
  resolution_type?: string;
  admin_notes?: string;
}

function DisputeModal({ dispute, open, onClose }: { dispute: DisputeRow; open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [status, setStatus] = useState(dispute.status ?? "in_mediation");
  const [resolutionType, setResolutionType] = useState(dispute.resolution_type ?? "");
  const [adminNotes, setAdminNotes] = useState(dispute.admin_notes ?? "");
  const [mediationNote, setMediationNote] = useState("");

  function handleSubmit() {
    const fd = new FormData();
    fd.append("id", dispute.dispute_id);
    fd.append("status", status);
    fd.append("resolution_type", resolutionType);
    fd.append("admin_notes", adminNotes);
    fd.append("mediation_note_non_binding", mediationNote);
    startTransition(async () => {
      await updateDisputeStatus(fd);
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Dispute Mediation" description={`Dispute #${dispute.dispute_id?.slice(0, 8)}`} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <div><span className="text-gray-400">Booking:</span> <IDCell value={dispute.booking_id} /></div>
            <div><span className="text-gray-400">Reason:</span> <span className="capitalize">{dispute.reason?.replace(/_/g, " ")}</span></div>
            <div><span className="text-gray-400">Reporter:</span> <IDCell value={dispute.reporter_id} /></div>
            <div><span className="text-gray-400">Reported user:</span> <IDCell value={dispute.reported_user_id} /></div>
            <div><span className="text-gray-400">Claimed amount:</span> <MoneyCell value={dispute.claimed_amount} /></div>
            <div><span className="text-gray-400">Current status:</span> <Badge status={dispute.status ?? "pending"} /></div>
          </div>

          <Select label="Update deposit flow status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="awaiting_host_action">Awaiting host action</option>
            <option value="claim_submitted">Claim submitted</option>
            <option value="guest_rejected">Guest rejected</option>
            <option value="in_mediation">In mediation</option>
            <option value="resolved">Resolved</option>
          </Select>

          {status === "resolved" && (
            <Select label="Resolution outcome" value={resolutionType} onChange={(e) => setResolutionType(e.target.value)}>
              <option value="">Select outcome…</option>
              <option value="release_guest">Release full deposit to guest</option>
              <option value="release_host">Release claimed amount to host</option>
              <option value="partial_split">Partial split</option>
            </Select>
          )}

          <Textarea
            label="Non-binding mediation note (visible internally)"
            value={mediationNote}
            onChange={(e) => setMediationNote(e.target.value)}
            rows={2}
            placeholder="Admin mediation is internal and non-binding — does not replace court (§8)…"
          />
          <Textarea
            label="Internal admin notes (not shown to users)"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={2}
            placeholder="Internal notes…"
          />

          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            Admin mediation is non-binding per §8 and does not replace legal proceedings.
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" loading={isPending} onClick={handleSubmit}>
              Update dispute
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DisputeActions({ row, role }: { row: DisputeRow; role: AdminRole }) {
  const [open, setOpen] = useState(false);
  const isReadOnly = role !== "full_access";

  if (isReadOnly) return <span className="text-xs text-gray-400 italic">Read-only</span>;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Gavel size={12} />
        Mediate
      </Button>
      <DisputeModal dispute={row} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const disputeStatusOptions = [
  "Awaiting host action",
  "Claim submitted",
  "Guest rejected",
  "In mediation",
  "Resolved",
];

const columns: Column<DisputeRow>[] = [
  {
    key: "dispute_id",
    header: "Dispute ID",
    render: (row) => <IDCell value={row.dispute_id} />,
  },
  {
    key: "booking_id",
    header: "Booking",
    render: (row) => <IDCell value={row.booking_id} />,
  },
  {
    key: "reason",
    header: "Reason",
    render: (row) => (
      <span className="capitalize text-gray-600">
        {String(row.reason ?? "").replace(/_/g, " ") || <span className="text-gray-400">—</span>}
      </span>
    ),
  },
  {
    key: "claimed_amount",
    header: "Claimed",
    render: (row) => <MoneyCell value={row.claimed_amount} />,
  },
  {
    key: "status",
    header: "Status",
    width: "160px",
    render: (row) => <Badge status={row.status ?? "pending"} dot />,
  },
  {
    key: "resolution_type",
    header: "Resolution",
    render: (row) =>
      row.resolution_type ? (
        <span className="text-xs text-gray-500 capitalize">{String(row.resolution_type).replace(/_/g, " ")}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),
  },
];

export function DisputesTable({ rows, role }: { rows: DisputeRow[]; role: AdminRole }) {
  return (
    <div>
      <SectionHeader
        title="Disputes & Deposit"
        description="Manage deposit claims following the §6.1 state machine. Admin mediation is non-binding (§8)."
      />
      <AdminTable
        columns={columns}
        rows={rows}
        renderActions={(row) => <DisputeActions row={row} role={role} />}
        searchFn={(row, q) =>
          row.dispute_id.toLowerCase().includes(q) ||
          String(row.booking_id ?? "").toLowerCase().includes(q) ||
          String(row.reason ?? "").toLowerCase().includes(q)
        }
        statusOptions={[
          { value: "awaiting_host_action", label: "Awaiting host" },
          { value: "claim_submitted", label: "Claim submitted" },
          { value: "guest_rejected", label: "Guest rejected" },
          { value: "in_mediation", label: "In mediation" },
          { value: "resolved", label: "Resolved" },
        ]}
        statusKey="status"
        emptyMessage="No disputes found. This is a good sign."
      />
    </div>
  );
}
