"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, EyeOff, Eye, Flag } from "lucide-react";
import { AdminTable, type Column, SectionHeader, DateCell, IDCell, TruncatedCell } from "@/components/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { moderateReview } from "@/app/(admin)/actions";
import { cn } from "@/lib/cn";
import type { AdminRole } from "@/lib/types";

interface ReviewRow {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  moderation_status: string;
  moderation_notes?: string;
  created_at: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={cn(i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200")}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">{rating}/5</span>
    </div>
  );
}

function ReviewActions({ row, role }: { row: ReviewRow; role: AdminRole }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isReadOnly = role !== "full_access";

  if (isReadOnly) return <span className="text-xs text-gray-400 italic">Read-only</span>;

  function moderate(status: string, note?: string) {
    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("moderation_status", status);
    if (note) fd.append("moderation_notes", note);
    startTransition(async () => {
      await moderateReview(fd);
      router.refresh();
    });
  }

  const isVisible = (row.moderation_status ?? "visible") === "visible";

  return (
    <div className="flex items-center gap-1.5">
      {isVisible ? (
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="sm" loading={isPending}>
              <EyeOff size={12} />
              Remove
            </Button>
          }
          title="Remove this review?"
          description="The review will be hidden from public view. The author will be notified."
          confirmLabel="Remove review"
          action={moderateReview}
          formData={{ id: row.id, moderation_status: "removed", moderation_notes: "Removed by admin" }}
        />
      ) : (
        <Button variant="secondary" size="sm" loading={isPending} onClick={() => moderate("visible")}>
          <Eye size={12} />
          Reinstate
        </Button>
      )}
      {row.moderation_status === "flagged" && (
        <Button variant="ghost" size="sm" onClick={() => moderate("visible", "Flag dismissed by admin")}>
          <Flag size={12} />
          Dismiss flag
        </Button>
      )}
    </div>
  );
}

const columns: Column<ReviewRow>[] = [
  {
    key: "id",
    header: "Review ID",
    render: (row) => <IDCell value={row.id} />,
  },
  {
    key: "participants",
    header: "Author → Target",
    render: (row) => (
      <div className="text-xs space-y-0.5">
        <p><span className="text-gray-400">From:</span> <IDCell value={row.reviewer_id} /></p>
        <p><span className="text-gray-400">To:</span> <IDCell value={row.reviewee_id} /></p>
      </div>
    ),
  },
  {
    key: "rating",
    header: "Rating",
    width: "130px",
    render: (row) => <StarRating rating={Number(row.rating ?? 0)} />,
  },
  {
    key: "comment",
    header: "Review text",
    render: (row) => <TruncatedCell value={row.comment} maxLength={80} />,
  },
  {
    key: "moderation_status",
    header: "Status",
    width: "110px",
    render: (row) => <Badge status={row.moderation_status ?? "visible"} dot />,
  },
  {
    key: "created_at",
    header: "Date",
    render: (row) => <DateCell value={row.created_at} />,
  },
];

export function ReviewsTable({ rows, role }: { rows: ReviewRow[]; role: AdminRole }) {
  return (
    <div>
      <SectionHeader
        title="Reviews"
        description="Moderate reviews — remove or reinstate only. Never edit content."
      />
      <AdminTable
        columns={columns}
        rows={rows}
        renderActions={(row) => <ReviewActions row={row} role={role} />}
        searchFn={(row, q) =>
          row.id.toLowerCase().includes(q) ||
          String(row.reviewer_id ?? "").toLowerCase().includes(q) ||
          String(row.comment ?? "").toLowerCase().includes(q)
        }
        statusOptions={[
          { value: "visible", label: "Visible" },
          { value: "removed", label: "Removed" },
          { value: "flagged", label: "Flagged" },
        ]}
        statusKey="moderation_status"
        dateKey="created_at"
        emptyMessage="No reviews found."
      />
    </div>
  );
}
