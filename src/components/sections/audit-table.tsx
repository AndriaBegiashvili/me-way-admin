"use client";

import { AdminTable, type Column, SectionHeader, DateCell, IDCell } from "@/components/admin-table";
import { cn } from "@/lib/cn";

interface AuditRow {
  id: string;
  timestamp?: string;
  created_at?: string;
  admin_user_id?: string;
  action_type?: string;
  target_entity_type?: string;
  target_entity_id?: string;
  metadata?: unknown;
}

const actionColors: Record<string, string> = {
  ban_user: "bg-red-50 text-red-700",
  approve_doc: "bg-green-50 text-green-700",
  refund_issued: "bg-orange-50 text-orange-700",
  review_removed: "bg-amber-50 text-amber-700",
  deposit_released: "bg-indigo-50 text-indigo-700",
  mediation_resolved: "bg-purple-50 text-purple-700",
  privacy_violation_flagged: "bg-red-50 text-red-700",
  car_status_updated: "bg-gray-100 text-gray-700",
  car_fields_updated: "bg-gray-100 text-gray-700",
  booking_payment_status_updated: "bg-gray-100 text-gray-700",
  territorial_violation_flagged: "bg-amber-50 text-amber-700",
  cancel_full_refund_technical_error: "bg-orange-50 text-orange-700",
  password_reset_link_sent: "bg-gray-100 text-gray-700",
  payout_status_changed: "bg-indigo-50 text-indigo-700",
};

function ActionTypeBadge({ action }: { action: string }) {
  const colorClass = actionColors[action] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-xs font-medium font-mono",
        colorClass
      )}
    >
      {action}
    </span>
  );
}

const columns: Column<AuditRow>[] = [
  {
    key: "timestamp",
    header: "Timestamp",
    render: (row) => <DateCell value={row.timestamp ?? row.created_at} />,
  },
  {
    key: "admin_user_id",
    header: "Admin",
    render: (row) => (
      row.admin_user_id ? <IDCell value={row.admin_user_id} /> : <span className="text-gray-400 text-xs">system</span>
    ),
  },
  {
    key: "action_type",
    header: "Action",
    render: (row) =>
      row.action_type ? (
        <ActionTypeBadge action={row.action_type} />
      ) : (
        <span className="text-gray-400">—</span>
      ),
  },
  {
    key: "target",
    header: "Target",
    render: (row) => (
      <div className="text-xs text-gray-500">
        {row.target_entity_type && (
          <span className="capitalize text-gray-600">{row.target_entity_type}: </span>
        )}
        {row.target_entity_id ? <IDCell value={row.target_entity_id} /> : <span className="text-gray-400">—</span>}
      </div>
    ),
  },
  {
    key: "metadata",
    header: "Metadata",
    render: (row) =>
      row.metadata ? (
        <code className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded block max-w-48 truncate">
          {JSON.stringify(row.metadata)}
        </code>
      ) : (
        <span className="text-gray-400">—</span>
      ),
  },
];

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  return (
    <div>
      <SectionHeader
        title="Audit Log"
        description="Immutable record of all admin actions. Cannot be edited or deleted."
      />
      <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 flex items-center gap-2">
        <span className="font-semibold">Read-only:</span>
        This log is immutable. No admin can edit or delete entries.
      </div>
      <AdminTable
        columns={columns}
        rows={rows}
        searchFn={(row, q) =>
          String(row.action_type ?? "").toLowerCase().includes(q) ||
          String(row.target_entity_id ?? "").toLowerCase().includes(q) ||
          String(row.admin_user_id ?? "").toLowerCase().includes(q)
        }
        statusOptions={[
          { value: "ban_user", label: "ban_user" },
          { value: "approve_doc", label: "approve_doc" },
          { value: "refund_issued", label: "refund_issued" },
          { value: "review_removed", label: "review_removed" },
          { value: "mediation_resolved", label: "mediation_resolved" },
        ]}
        statusKey="action_type"
        dateKey="timestamp"
        emptyMessage="No audit log entries found."
      />
    </div>
  );
}
