# Meway Admin Panel

Standalone Next.js admin panel scaffold for launch scope v1.1.

## Start

1. Install dependencies:

```bash
npm install
```

2. Add environment variables to `.env.local` (same Supabase project as main app):

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_ROLE=full_access
# Same secret as main app; used to sign links to /api/admin/open (impersonation / open-in-app).
ADMIN_SSO_SECRET=...
# Public URL of the main Meway app (e.g. http://localhost:3001 in dev, https://meway.ge in prod).
NEXT_PUBLIC_MAIN_APP_URL=...
```

3. Run:

```bash
npm run dev
```

The app runs on `http://localhost:3002`.

## Wired to current database

The admin now reads live data from your existing Supabase schema:

- `dashboard`: live counts from `profiles`, `bookings`, `reports`
- `cars`: live rows from `cars` + status update action
- `users`: live rows from `profiles`
- `bookings`: live rows from `bookings` + payment status update action
- `payouts`: derived payout view from paid bookings (no dedicated `payouts` table yet)
- `disputes`: live rows from `reports` + status/admin note update action
- `reviews`: live rows from `reviews`
- `audit-log`: uses `booking_admin_alerts` when available
- `notifications-log`: live rows from `notifications`

## Launch actions enabled

Admin action forms are available across Cars, Users, Bookings, Payouts, Disputes, Reviews, and Notifications.
To enable the full launch action model, apply migration `supabase/migrations/031_admin_panel_launch_scope.sql` from the **me-way-web** repository (same Supabase project).

This migration adds admin-specific columns/tables used by new actions:
- `payouts`
- `admin_audit_log` (immutable)
- moderation/compliance fields for `profiles`, `bookings`, `reviews`, `reports`, `notifications`

## Current schema gaps vs product spec

- No dedicated tables yet for: immutable audit log, payout ledger/status lifecycle, delivery channel/status for notifications, and formal dispute/deposit state machine.
- Until those are added, the panel maps to closest existing entities (`reports`, `bookings`, `booking_admin_alerts`).
