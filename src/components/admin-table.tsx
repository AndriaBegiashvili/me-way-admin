"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render: (row: T) => ReactNode;
}

interface FilterOption {
  value: string;
  label: string;
}

interface AdminTableProps<T extends object> {
  columns: Column<T>[];
  rows: T[];
  renderActions?: (row: T) => ReactNode;
  searchFn?: (row: T, query: string) => boolean;
  statusOptions?: FilterOption[];
  statusKey?: keyof T;
  dateKey?: keyof T;
  emptyMessage?: string;
  pageSize?: number;
}

const PAGE_SIZE = 25;

export function AdminTable<T extends object>({
  columns,
  rows,
  renderActions,
  searchFn,
  statusOptions,
  statusKey,
  dateKey,
  emptyMessage = "No records found.",
  pageSize = PAGE_SIZE,
}: AdminTableProps<T>) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((row) => {
      const textMatch = !q || (searchFn ? searchFn(row, q) : true);

      const statusValue = statusKey ? String(row[statusKey] ?? "") : "";
      const statusMatch = statusFilter === "all" || statusValue === statusFilter;

      const dateStr = dateKey ? String(row[dateKey] ?? "") : "";
      const dateMatch = (() => {
        if (dateRange === "all" || !dateStr) return true;
        const date = new Date(dateStr).getTime();
        const now = Date.now();
        if (Number.isNaN(date)) return true;
        const ms = {
          today: 24 * 3600 * 1000,
          "7d": 7 * 24 * 3600 * 1000,
          "30d": 30 * 24 * 3600 * 1000,
        }[dateRange];
        return ms ? now - date <= ms : true;
      })();

      return textMatch && statusMatch && dateMatch;
    });
  }, [rows, search, searchFn, statusFilter, statusKey, dateRange, dateKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeP = Math.min(page, totalPages);
  const pageRows = filtered.slice((safeP - 1) * pageSize, safeP * pageSize);

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }
  function handleStatus(v: string) {
    setStatusFilter(v);
    setPage(1);
  }
  function handleDate(v: string) {
    setDateRange(v);
    setPage(1);
  }

  const hasFilters = statusOptions || dateKey;

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search…"
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-400" />
            {statusOptions && (
              <select
                value={statusFilter}
                onChange={(e) => handleStatus(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            {dateKey && (
              <select
                value={dateRange}
                onChange={(e) => handleDate(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            )}
          </div>
        )}

        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} {filtered.length === 1 ? "row" : "rows"}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    style={col.width ? { width: col.width } : {}}
                  >
                    {col.header}
                  </th>
                ))}
                {renderActions && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-0">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (renderActions ? 1 : 0)}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    {search || statusFilter !== "all" || dateRange !== "all"
                      ? "No rows match the current filters."
                      : emptyMessage}
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr
                    key={String((row as Record<string, unknown>).id ?? (row as Record<string, unknown>).dispute_id ?? i)}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
                      >
                        {col.render(row)}
                      </td>
                    ))}
                    {renderActions && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">{renderActions(row)}</div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 border-t border-gray-100",
            filtered.length <= pageSize ? "hidden" : ""
          )}
        >
          <span className="text-xs text-gray-400">
            {(safeP - 1) * pageSize + 1}–{Math.min(safeP * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={safeP <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 text-xs font-medium text-gray-700">
              {safeP} / {totalPages}
            </span>
            <button
              disabled={safeP >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared cell renderers
export function DateCell({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-gray-400">—</span>;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return <span className="text-gray-400">—</span>;
  return (
    <span className="text-gray-600 text-xs">
      {d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      <br />
      <span className="text-gray-400">
        {d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </span>
    </span>
  );
}

export function MoneyCell({ value, currency = "GEL" }: { value: number | null | undefined; currency?: string }) {
  if (value == null) return <span className="text-gray-400">—</span>;
  return (
    <span className="font-medium tabular-nums">
      {Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
    </span>
  );
}

export function TruncatedCell({ value, maxLength = 60 }: { value: string | null | undefined; maxLength?: number }) {
  if (!value) return <span className="text-gray-400">—</span>;
  const truncated = value.length > maxLength ? value.slice(0, maxLength) + "…" : value;
  return <span title={value}>{truncated}</span>;
}

export function IDCell({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-gray-400">—</span>;
  return (
    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
      {String(value).slice(0, 8)}…
    </span>
  );
}

// Page section header
export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
