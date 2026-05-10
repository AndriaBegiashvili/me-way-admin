"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Mail, Phone, Bell } from "lucide-react";
import { AdminTable, type Column, SectionHeader, DateCell, IDCell, TruncatedCell } from "@/components/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { resendNotification } from "@/app/(admin)/actions";
import { cn } from "@/lib/cn";
import type { AdminRole } from "@/lib/types";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  channel: string;
  delivery_status: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const channelIcons = {
  email: Mail,
  sms: Phone,
  push: Bell,
};

function ChannelBadge({ channel }: { channel: string }) {
  const Icon = channelIcons[channel?.toLowerCase() as keyof typeof channelIcons] ?? Bell;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
      <Icon size={12} className="text-gray-400" />
      <span className="capitalize">{channel}</span>
    </span>
  );
}

function NotificationActions({ row, role }: { row: NotificationRow; role: AdminRole }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isFailed = ["failed", "bounced"].includes(String(row.delivery_status ?? ""));
  const isReadOnly = role !== "full_access";

  if (isReadOnly) return <span className="text-xs text-gray-400 italic">Read-only</span>;

  if (!isFailed) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" loading={isPending}>
          <RotateCcw size={12} />
          Resend
        </Button>
      }
      title="Resend notification?"
      description="This will trigger a resend for this failed notification."
      confirmLabel="Resend"
      variant="warning"
      action={resendNotification}
      formData={{ id: row.id }}
    />
  );
}

const columns: Column<NotificationRow>[] = [
  {
    key: "created_at",
    header: "Timestamp",
    render: (row) => <DateCell value={row.created_at} />,
  },
  {
    key: "user_id",
    header: "Recipient",
    render: (row) => <IDCell value={row.user_id} />,
  },
  {
    key: "channel",
    header: "Channel",
    width: "100px",
    render: (row) => <ChannelBadge channel={row.channel} />,
  },
  {
    key: "type",
    header: "Type",
    render: (row) => (
      <code className="text-[11px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
        {row.type ?? "—"}
      </code>
    ),
  },
  {
    key: "title",
    header: "Title",
    render: (row) => <TruncatedCell value={row.title} maxLength={50} />,
  },
  {
    key: "delivery_status",
    header: "Status",
    width: "110px",
    render: (row) => <Badge status={row.delivery_status ?? "pending"} dot />,
  },
];

export function NotificationsTable({ rows, role }: { rows: NotificationRow[]; role: AdminRole }) {
  return (
    <div>
      <SectionHeader
        title="Notifications Log"
        description="Read-only log of all outbound communications. Resend only available for failed deliveries."
      />
      <AdminTable
        columns={columns}
        rows={rows}
        renderActions={(row) => <NotificationActions row={row} role={role} />}
        searchFn={(row, q) =>
          String(row.user_id ?? "").toLowerCase().includes(q) ||
          String(row.type ?? "").toLowerCase().includes(q) ||
          String(row.title ?? "").toLowerCase().includes(q)
        }
        statusOptions={[
          { value: "delivered", label: "Delivered" },
          { value: "failed", label: "Failed" },
          { value: "bounced", label: "Bounced" },
          { value: "pending", label: "Pending" },
        ]}
        statusKey="delivery_status"
        dateKey="created_at"
        emptyMessage="No notifications logged."
      />
    </div>
  );
}
