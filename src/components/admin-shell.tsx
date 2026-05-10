"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { AdminRole } from "@/lib/types";
import {
  LayoutDashboard,
  Car,
  Users,
  Calendar,
  CreditCard,
  ShieldAlert,
  Star,
  FileText,
  Bell,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cars", label: "Cars", icon: Car },
  { href: "/users", label: "Users", icon: Users },
  { href: "/bookings", label: "Bookings", icon: Calendar },
  { href: "/payouts", label: "Payouts", icon: CreditCard },
  { href: "/disputes", label: "Disputes & Deposit", icon: ShieldAlert },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/audit-log", label: "Audit Log", icon: FileText },
  { href: "/notifications-log", label: "Notifications", icon: Bell },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/cars": "Cars",
  "/users": "Users",
  "/bookings": "Bookings",
  "/payouts": "Payouts",
  "/disputes": "Disputes & Deposit",
  "/reviews": "Reviews",
  "/audit-log": "Audit Log",
  "/notifications-log": "Notifications Log",
};

export function AdminShell({ children, role }: { children: ReactNode; role: AdminRole }) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Meway Admin";

  return (
    <div className="flex h-screen bg-[#f6f7fb] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-[#030213] overflow-y-auto">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
              <Car size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Meway</p>
              <p className="text-[10px] text-white/50 mt-0.5 leading-none">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium relative",
                  isActive
                    ? "bg-white/12 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-r-full" />
                )}
                <Icon
                  size={16}
                  className={cn(
                    "flex-shrink-0",
                    isActive ? "text-indigo-400" : "text-white/40"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && (
                  <ChevronRight size={12} className="text-white/30 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center flex-shrink-0",
                role === "full_access" ? "bg-indigo-500/20" : "bg-white/10"
              )}
            >
              <Shield size={14} className={role === "full_access" ? "text-indigo-400" : "text-white/50"} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">Admin</p>
              <p className={cn("text-[10px] truncate", role === "full_access" ? "text-indigo-400" : "text-white/40")}>
                {role === "full_access" ? "Full access" : "Read-only"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-white border-b border-black/8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 text-xs font-medium">Meway</span>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="font-semibold text-gray-900">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">v1.1 Launch Scope</span>
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-1 rounded-full",
                role === "full_access"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              )}
            >
              {role === "full_access" ? "Full Access" : "Read-Only"}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
