import type { KpiSpec, SectionSpec } from "@/lib/types";

export const dashboardKpis: KpiSpec[] = [
  {
    key: "pending-doc-verifications",
    label: "Pending doc verifications",
    description: "Count of users with docs pending review",
    clickAction: "Filter users table to pending docs",
    tone: "yellow"
  },
  {
    key: "active-bookings",
    label: "Active bookings",
    description: "Live count of currently active bookings",
    clickAction: "Open bookings table with active filter"
  },
  {
    key: "open-disputes",
    label: "Open disputes / deposit claims",
    description: "Current unresolved dispute count",
    clickAction: "Open disputes table",
    tone: "red"
  },
  {
    key: "revenue-today",
    label: "Revenue today",
    description: "Sum of paid bookings for current day",
    clickAction: "Open bookings with paid + today filters",
    tone: "green"
  }
];

export const sectionSpecs: SectionSpec[] = [
  {
    key: "cars",
    title: "Cars",
    summary: "Search by model/plate, filter by status, city, and host.",
    columns: [
      { label: "Car details (model, plate)", action: "Edit any car field in modal" },
      {
        label: "Listing status",
        indicator: "Pending moderation",
        tone: "yellow",
        action: "Publish, hide, suspend, or restrict visibility (§3.2)"
      },
      { label: "Owner info", action: "Open host profile" },
      { label: "Pricing", action: "Manual price adjustment" },
      { label: "Location / city", action: "Edit city for market filtering" },
      { label: "Mileage limit", action: "Edit mileage limit" }
    ]
  },
  {
    key: "users",
    title: "Users",
    summary: "Search by contact data, filter by role/account status.",
    columns: [
      { label: "Name & contact", action: "Edit name, email, phone" },
      { label: "Role", indicator: "Host vs guest (derived)", action: "Auto-calculated from listing count" },
      { label: "Doc verification", indicator: "Pending review", tone: "yellow", action: "Approve or reject docs" },
      {
        label: "Privacy violation flag",
        indicator: "Reported",
        tone: "red",
        action: "Warn host or ban for confirmed §2 violation"
      },
      { label: "Account status", indicator: "Banned", tone: "red", action: "Ban / unban account immediately" },
      { label: "Password", action: "Send password reset link only" },
      { label: "Sign-up date", action: "Read-only" },
      { label: "Total bookings", action: "Read-only completed booking count" },
      { label: "Total earnings (host)", action: "Read-only sum of paid-out bookings" }
    ]
  },
  {
    key: "bookings",
    title: "Bookings",
    summary: "Search by ID/participants, filter by payment status/date.",
    columns: [
      { label: "Booking ID / reference", action: "Read-only reference" },
      { label: "Participants (host / guest)", action: "Link to both user profiles" },
      { label: "Car & period", action: "Override start/end dates with calendar picker" },
      {
        label: "Confirmation deadline",
        indicator: "Approaching deadline",
        tone: "orange",
        action: "Auto-calculate and allow admin confirm on host behalf"
      },
      { label: "Total price", action: "Override with custom adjustment (§3.1)" },
      {
        label: "Late return",
        indicator: "Late 0-30 min/30 min-3h/3h+ tiers",
        tone: "yellow",
        action: "Apply or override late charge tiers (§6.2)"
      },
      { label: "Payment status", indicator: "Paid/Pending/Refunded", action: "Mark paid or issue partial/full refund" },
      { label: "Cancellation reason & type", action: "Apply asymmetric cancellation logic (§7)" },
      { label: "Host rating impact", action: "Read-only policy-driven rating outcome (§5.2)" },
      { label: "Insurance plan selected", action: "Read-only" },
      { label: "Damage report flag", indicator: "Damage reported", tone: "red", action: "Open dispute flow" }
    ]
  },
  {
    key: "payouts",
    title: "Payouts",
    summary: "One payout row per booking; dispute can hold release.",
    columns: [
      { label: "Host name", action: "Open host profile" },
      { label: "Linked booking ID", action: "Open booking" },
      { label: "Payout amount", action: "Read-only payout amount" },
      { label: "Payout status", indicator: "Pending/Sent/Failed/On hold", action: "Send payout, hold, or release (§6.1)" },
      { label: "Payout method on file", action: "Read-only payout method" }
    ]
  },
  {
    key: "disputes",
    title: "Disputes & Deposit",
    summary: "Status mirrors deposit state machine from §6.1.",
    columns: [
      { label: "Dispute ID", action: "Read-only" },
      { label: "Linked booking & participants", action: "Open booking and both user profiles" },
      { label: "Dispute reason", action: "Read-only creation reason" },
      { label: "Claimed amount", action: "Host requested amount from deposit" },
      { label: "Deposit flow status", indicator: "Awaiting host/Claim submitted/Guest rejected/In mediation/Resolved", action: "State transitions per §6.1" },
      { label: "Evidence submitted", action: "View uploaded photo/video evidence" },
      { label: "Resolution", action: "Release to guest, host, or split (non-binding §8)" },
      { label: "Admin notes", action: "Internal-only notes" }
    ]
  },
  {
    key: "reviews",
    title: "Reviews",
    summary: "Moderation supports remove/reinstate only.",
    columns: [
      { label: "Review ID, author, target", action: "Open both user profiles" },
      { label: "Review text & rating", indicator: "Flagged", tone: "yellow", action: "Remove review or dismiss flag" },
      { label: "Date submitted", action: "Read-only" },
      { label: "Status", indicator: "Visible/Removed", action: "Reinstate removed review" }
    ]
  },
  {
    key: "audit-log",
    title: "Audit Log",
    summary: "Immutable log of admin actions.",
    columns: [
      { label: "Timestamp", action: "Read-only; immutable" },
      { label: "Admin user", action: "Actor account identifier" },
      { label: "Action type", action: "ban_user, approve_doc, refund_issued, and others" },
      { label: "Target entity", action: "Open affected user/booking/car" }
    ]
  },
  {
    key: "notifications-log",
    title: "Notifications Log",
    summary: "Read-only outbound communication history.",
    columns: [
      { label: "Timestamp", action: "Read-only" },
      { label: "Recipient", action: "Open user profile" },
      { label: "Channel", action: "Email / SMS / Push" },
      { label: "Notification type", action: "booking_confirmed, doc_rejected, payout_sent, and others" },
      { label: "Delivery status", indicator: "Delivered/Failed/Bounced", action: "Resend only failed deliveries" }
    ]
  }
];
