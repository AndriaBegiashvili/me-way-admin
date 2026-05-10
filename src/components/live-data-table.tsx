"use client";

import {
  cancelBookingTechnicalError,
  flagTerritorialViolation,
  issueBookingRefund,
  moderateReview,
  resendNotification,
  sendPasswordReset,
  updateBookingDates,
  updateBookingPayment,
  updateBookingPriceAndLateFee,
  updateCarFields,
  updateCarStatus,
  updateDisputeStatus,
  updatePayoutStatus,
  updateUserCompliance,
  updateUserContact
} from "@/app/(admin)/actions";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { AdminRole } from "@/lib/types";

type Row = Record<string, unknown>;

function confirmSubmit(message: string) {
  return (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  };
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function LiveDataTable({ rows, sectionKey, role }: { rows: Row[]; sectionKey: string; role: AdminRole }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const filteredRows = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    return rows.filter((row) => {
      const textMatch =
        !searchLower ||
        Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(searchLower));
      const statusValue =
        String(row.status ?? row.payment_status ?? row.delivery_status ?? row.account_status ?? "unknown");
      const statusMatch = statusFilter === "all" || statusValue === statusFilter;
      const createdAt = String(row.created_at ?? row.timestamp ?? "");
      const dateMatch = (() => {
        if (dateRange === "all" || !createdAt) return true;
        const date = new Date(createdAt).getTime();
        const now = Date.now();
        if (Number.isNaN(date)) return true;
        if (dateRange === "today") return now - date <= 24 * 60 * 60 * 1000;
        if (dateRange === "7d") return now - date <= 7 * 24 * 60 * 60 * 1000;
        if (dateRange === "30d") return now - date <= 30 * 24 * 60 * 60 * 1000;
        return true;
      })();
      return textMatch && statusMatch && dateMatch;
    });
  }, [rows, search, statusFilter, dateRange]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  if (rows.length === 0) {
    return <p>No rows found in database for this section yet.</p>;
  }

  return (
    <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, padding: 10 }}>
        <input
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name / ID / identifier"
          style={{ padding: 8, border: "1px solid #d1d5db", borderRadius: 8, minWidth: 280 }}
          value={search}
        />
        <select
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{ padding: 8, border: "1px solid #d1d5db", borderRadius: 8 }}
          value={statusFilter}
        >
          <option value="all">All statuses</option>
          <option value="pending">pending</option>
          <option value="active">active</option>
          <option value="approved">approved</option>
          <option value="cancelled">cancelled</option>
          <option value="resolved">resolved</option>
          <option value="failed">failed</option>
          <option value="bounced">bounced</option>
          <option value="banned">banned</option>
        </select>
        <select
          onChange={(e) => {
            setDateRange(e.target.value);
            setPage(1);
          }}
          style={{ padding: 8, border: "1px solid #d1d5db", borderRadius: 8 }}
          value={dateRange}
        >
          <option value="all">All dates</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>
                {col}
              </th>
            ))}
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>actions</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 && (
            <tr>
              <td colSpan={Math.max(1, columns.length + 1)} style={{ padding: 10 }}>
                No rows found for current filters.
              </td>
            </tr>
          )}
          {pageRows.map((row, index) => (
            <tr key={String(row.id ?? row.booking_id ?? index)}>
              {columns.map((col) => (
                <td key={col} style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
                  {formatValue(row[col])}
                </td>
              ))}
              <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
                {role === "read_only" ? "Read-only role" : renderAction(sectionKey, row)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "space-between", padding: 10 }}>
        <span>Rows per page: 25</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} type="button">
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} type="button">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function renderAction(sectionKey: string, row: Row) {
  if (sectionKey === "cars" && row.id) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <form action={updateCarStatus} style={{ display: "flex", gap: 8 }}>
          <input name="id" type="hidden" value={String(row.id)} />
          <select name="status" defaultValue={String(row.status ?? "pending")}>
            <option value="pending">pending moderation</option>
            <option value="approved">approved</option>
            <option value="active">publish active</option>
            <option value="inactive">hide/deactivate</option>
            <option value="rejected">reject</option>
          </select>
          <button type="submit">Set status</button>
        </form>
        <form action={updateCarFields} style={{ display: "flex", gap: 6 }}>
          <input name="id" type="hidden" value={String(row.id)} />
          <input name="daily_price" placeholder="daily price" style={{ width: 92 }} />
          <input name="pickup_city" placeholder="city" style={{ width: 90 }} />
          <input name="mileage" placeholder="mileage" style={{ width: 90 }} />
          <button type="submit">Edit fields</button>
        </form>
      </div>
    );
  }

  if (sectionKey === "users" && row.id) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <form action={updateUserContact} style={{ display: "flex", gap: 6 }}>
          <input name="id" type="hidden" value={String(row.id)} />
          <input defaultValue={String(row.first_name ?? "")} name="first_name" placeholder="first" style={{ width: 90 }} />
          <input defaultValue={String(row.last_name ?? "")} name="last_name" placeholder="last" style={{ width: 90 }} />
          <input defaultValue={String(row.email ?? "")} name="email" placeholder="email" style={{ width: 140 }} />
          <input defaultValue={String(row.phone_number ?? "")} name="phone_number" placeholder="phone" style={{ width: 110 }} />
          <button type="submit">Save contact</button>
        </form>
        <form action={updateUserCompliance} onSubmit={confirmSubmit("Confirm compliance/account status update?")} style={{ display: "flex", gap: 6 }}>
          <input name="id" type="hidden" value={String(row.id)} />
          <select name="docs_verification_status" defaultValue={String(row.docs_status ?? "pending")}>
            <option value="pending">docs pending</option>
            <option value="approved">docs approved</option>
            <option value="rejected">docs rejected</option>
          </select>
          <select name="account_status" defaultValue={String(row.account_status ?? "active")}>
            <option value="active">active</option>
            <option value="banned">banned</option>
          </select>
          <select name="privacy_violation_flag" defaultValue={String(Boolean(row.privacy_violation_flag))}>
            <option value="false">privacy ok</option>
            <option value="true">privacy violation</option>
          </select>
          <input name="privacy_violation_notes" placeholder="violation note" style={{ width: 140 }} />
          <button type="submit">Compliance</button>
        </form>
        <form action={sendPasswordReset}>
          <input name="id" type="hidden" value={String(row.id)} />
          <button type="submit">Send password reset</button>
        </form>
      </div>
    );
  }

  if (sectionKey === "bookings" && row.id) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <form action={updateBookingPayment} style={{ display: "flex", gap: 6 }}>
          <input name="id" type="hidden" value={String(row.id)} />
          <select name="payment_status" defaultValue={String(row.payment_status ?? "pending")}>
            <option value="pending">pending</option>
            <option value="paid">mark paid</option>
            <option value="refunded">mark refunded</option>
            <option value="failed">failed</option>
          </select>
          <button type="submit">Save</button>
        </form>
        <form action={updateBookingDates} style={{ display: "flex", gap: 6 }}>
          <input name="id" type="hidden" value={String(row.id)} />
          <input defaultValue={String(row.start_date ?? "")} name="start_date" type="date" />
          <input defaultValue={String(row.end_date ?? "")} name="end_date" type="date" />
          <button type="submit">Override dates</button>
        </form>
        <form action={updateBookingPriceAndLateFee} style={{ display: "flex", gap: 6 }}>
          <input name="id" type="hidden" value={String(row.id)} />
          <input defaultValue={String(row.total_amount ?? "")} name="total_amount" placeholder="total" style={{ width: 90 }} />
          <select name="late_fee_tier" defaultValue={String(row.late_fee_tier ?? "none")}>
            <option value="none">late none</option>
            <option value="tier1">late tier1</option>
            <option value="tier2">late tier2</option>
          </select>
          <input defaultValue={String(row.late_fee_amount ?? "")} name="late_fee_amount" placeholder="late fee" style={{ width: 90 }} />
          <button type="submit">Price/late fee</button>
        </form>
        <form action={issueBookingRefund} onSubmit={confirmSubmit("Confirm issuing refund?")} style={{ display: "flex", gap: 6 }}>
          <input name="id" type="hidden" value={String(row.id)} />
          <input name="refund_amount" placeholder="refund amount" style={{ width: 110 }} />
          <input name="refund_reason_code" placeholder="reason code" style={{ width: 110 }} />
          <button type="submit">Issue refund</button>
        </form>
        <form action={cancelBookingTechnicalError} onSubmit={confirmSubmit("Confirm cancel + full refund for technical error?")} style={{ display: "flex", gap: 6 }}>
          <input name="id" type="hidden" value={String(row.id)} />
          <button type="submit">Cancel + full refund (technical)</button>
        </form>
        <form action={flagTerritorialViolation} onSubmit={confirmSubmit("Confirm territorial violation escalation?")} style={{ display: "flex", gap: 6 }}>
          <input name="id" type="hidden" value={String(row.id)} />
          <input name="territorial_violation_notes" placeholder="territorial violation note" style={{ width: 170 }} />
          <button type="submit">Flag territorial violation</button>
        </form>
      </div>
    );
  }

  if (sectionKey === "disputes" && row.dispute_id) {
    return (
      <form action={updateDisputeStatus} style={{ display: "grid", gap: 8 }}>
        <input name="id" type="hidden" value={String(row.dispute_id)} />
        <select name="status" defaultValue={String(row.status ?? "pending")}>
          <option value="awaiting_host_action">awaiting host</option>
          <option value="claim_submitted">claim submitted</option>
          <option value="guest_rejected">guest rejected</option>
          <option value="in_mediation">in mediation</option>
          <option value="resolved">resolved</option>
        </select>
        <select name="resolution_type" defaultValue={String(row.resolution_type ?? "")}>
          <option value="">resolution</option>
          <option value="release_guest">release to guest</option>
          <option value="release_host">release to host</option>
          <option value="partial_split">partial split</option>
        </select>
        <input name="admin_notes" placeholder="Admin note" />
        <input name="mediation_note_non_binding" placeholder="Non-binding mediation note" />
        <button type="submit">Update</button>
      </form>
    );
  }

  if (sectionKey === "payouts" && row.id) {
    return (
      <form action={updatePayoutStatus} style={{ display: "grid", gap: 8 }}>
        <input name="id" type="hidden" value={String(row.id)} />
        <select name="status" defaultValue={String(row.status ?? "pending")}>
          <option value="pending">pending</option>
          <option value="sent">sent</option>
          <option value="failed">failed</option>
          <option value="on_hold">on hold</option>
        </select>
        <input name="hold_reason" placeholder="hold reason (optional)" />
        <button type="submit">Update payout</button>
      </form>
    );
  }

  if (sectionKey === "reviews" && row.id) {
    return (
      <form action={moderateReview} onSubmit={confirmSubmit("Confirm review moderation change?")} style={{ display: "grid", gap: 8 }}>
        <input name="id" type="hidden" value={String(row.id)} />
        <select name="moderation_status" defaultValue={String(row.moderation_status ?? "visible")}>
          <option value="visible">visible / reinstate</option>
          <option value="removed">remove review</option>
        </select>
        <input name="moderation_notes" placeholder="moderation note" />
        <button type="submit">Apply</button>
      </form>
    );
  }

  if (sectionKey === "notifications-log" && row.id) {
    return (
      <form action={resendNotification}>
        <input name="id" type="hidden" value={String(row.id)} />
        <button disabled={!["failed", "bounced"].includes(String(row.delivery_status ?? ""))} type="submit">
          Resend failed
        </button>
      </form>
    );
  }

  return "-";
}
