import { getSectionRows } from "@/lib/admin-data";
import { AuditTable } from "@/components/sections/audit-table";

export default async function AuditLogPage() {
  const rows = await getSectionRows("audit-log");
  return <AuditTable rows={rows as never} />;
}
