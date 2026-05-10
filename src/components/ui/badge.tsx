import { cn } from "@/lib/cn";

type BadgeVariant =
  | "default"
  | "active"
  | "pending"
  | "approved"
  | "rejected"
  | "banned"
  | "cancelled"
  | "on_hold"
  | "in_mediation"
  | "resolved"
  | "failed"
  | "bounced"
  | "delivered"
  | "sent"
  | "refunded"
  | "paid"
  | "visible"
  | "removed"
  | "flagged"
  | "missing"
  | "host"
  | "guest"
  | "warning";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  active: "bg-green-50 text-green-700 border border-green-200",
  approved: "bg-green-50 text-green-700 border border-green-200",
  delivered: "bg-green-50 text-green-700 border border-green-200",
  sent: "bg-green-50 text-green-700 border border-green-200",
  paid: "bg-green-50 text-green-700 border border-green-200",
  resolved: "bg-green-50 text-green-700 border border-green-200",
  visible: "bg-green-50 text-green-700 border border-green-200",
  host: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  flagged: "bg-amber-50 text-amber-700 border border-amber-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  on_hold: "bg-orange-50 text-orange-700 border border-orange-200",
  in_mediation: "bg-purple-50 text-purple-700 border border-purple-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
  banned: "bg-red-50 text-red-700 border border-red-200",
  failed: "bg-red-50 text-red-700 border border-red-200",
  bounced: "bg-red-50 text-red-700 border border-red-200",
  removed: "bg-red-50 text-red-700 border border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border border-gray-200",
  refunded: "bg-gray-100 text-gray-600 border border-gray-200",
  missing: "bg-gray-100 text-gray-500 border border-gray-200",
  guest: "bg-gray-100 text-gray-600 border border-gray-200",
};

const labelMap: Partial<Record<string, string>> = {
  active: "Active",
  approved: "Approved",
  delivered: "Delivered",
  sent: "Sent",
  paid: "Paid",
  resolved: "Resolved",
  visible: "Visible",
  pending: "Pending",
  flagged: "Flagged",
  on_hold: "On Hold",
  in_mediation: "In Mediation",
  rejected: "Rejected",
  banned: "Banned",
  failed: "Failed",
  bounced: "Bounced",
  removed: "Removed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  missing: "Missing",
  host: "Host",
  guest: "Guest",
  awaiting_host_action: "Awaiting Host",
  claim_submitted: "Claim Submitted",
  guest_rejected: "Guest Rejected",
};

function getVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase().replace(/[\s-]/g, "_");
  if (normalized in variantClasses) return normalized as BadgeVariant;
  return "default";
}

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
  dot?: boolean;
}

export function Badge({ status, label, className, dot = false }: BadgeProps) {
  const variant = getVariant(status);
  const displayLabel = label ?? labelMap[status.toLowerCase()] ?? status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            variant === "active" || variant === "approved" || variant === "delivered" || variant === "paid" || variant === "resolved" || variant === "sent" || variant === "visible"
              ? "bg-green-500"
              : variant === "pending" || variant === "flagged"
              ? "bg-amber-500"
              : variant === "on_hold"
              ? "bg-orange-500"
              : variant === "in_mediation"
              ? "bg-purple-500"
              : variant === "rejected" || variant === "banned" || variant === "failed" || variant === "removed" || variant === "bounced"
              ? "bg-red-500"
              : "bg-gray-400"
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}
