import Link from "next/link";
import { FileCheck, Calendar, ShieldAlert, TrendingUp, ArrowRight } from "lucide-react";
import type { DashboardMetrics } from "@/lib/admin-data";
import { cn } from "@/lib/cn";

interface KpiConfig {
  key: keyof DashboardMetrics;
  label: string;
  description: string;
  href: string;
  icon: typeof TrendingUp;
  format: (value: number) => string;
  tone: "indigo" | "green" | "red" | "amber";
}

const kpis: KpiConfig[] = [
  {
    key: "pendingDocVerifications",
    label: "Pending Verifications",
    description: "Docs awaiting review",
    href: "/users?filter=pending",
    icon: FileCheck,
    format: (v) => String(v),
    tone: "amber",
  },
  {
    key: "activeBookings",
    label: "Active Bookings",
    description: "Live bookings in progress",
    href: "/bookings?filter=active",
    icon: Calendar,
    format: (v) => String(v),
    tone: "indigo",
  },
  {
    key: "openDisputes",
    label: "Open Disputes",
    description: "Unresolved deposit claims",
    href: "/disputes",
    icon: ShieldAlert,
    format: (v) => String(v),
    tone: "red",
  },
  {
    key: "revenueToday",
    label: "Revenue Today",
    description: "Paid bookings, current day",
    href: "/bookings?filter=paid",
    icon: TrendingUp,
    format: (v) => `${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GEL`,
    tone: "green",
  },
];

const toneClasses = {
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    badge: "bg-indigo-100 text-indigo-700",
    border: "border-indigo-100",
    hover: "hover:border-indigo-200 hover:shadow-indigo-100/50",
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-600",
    badge: "bg-green-100 text-green-700",
    border: "border-green-100",
    hover: "hover:border-green-200 hover:shadow-green-100/50",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-600",
    badge: "bg-red-100 text-red-700",
    border: "border-red-100",
    hover: "hover:border-red-200 hover:shadow-red-100/50",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-100",
    hover: "hover:border-amber-200 hover:shadow-amber-100/50",
  },
};

export function DashboardKpis({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const tc = toneClasses[kpi.tone];
        const Icon = kpi.icon;
        const value = metrics[kpi.key];
        const isUrgent = kpi.tone === "red" && Number(value) > 0;

        return (
          <Link
            key={kpi.key}
            href={kpi.href}
            className={cn(
              "group flex flex-col gap-3 p-5 bg-white rounded-xl border shadow-sm",
              "transition-all duration-200 hover:shadow-md",
              isUrgent ? "border-red-200 shadow-red-50" : "border-gray-100",
              tc.hover
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn("size-10 rounded-xl flex items-center justify-center", tc.bg)}>
                <Icon size={18} className={tc.icon} />
              </div>
              {isUrgent && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full animate-pulse">
                  Urgent
                </span>
              )}
            </div>

            <div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {kpi.format(Number(value))}
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-600">{kpi.label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{kpi.description}</p>
            </div>

            <div className="flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-indigo-600 transition-colors">
              <span>View details</span>
              <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
