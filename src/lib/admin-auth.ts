import type { AdminRole } from "@/lib/types";

/**
 * Temporary auth bootstrap:
 * - Reads ADMIN_ROLE from env for quick setup.
 * - Replace with real admin user/session and RBAC mapping.
 */
export function getCurrentAdminRole(): AdminRole {
  const value = process.env.ADMIN_ROLE;
  if (value === "full_access") {
    return "full_access";
  }
  return "read_only";
}

export function canRunDestructiveAction(role: AdminRole) {
  return role === "full_access";
}
