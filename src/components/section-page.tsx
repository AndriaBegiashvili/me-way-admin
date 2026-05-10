import { LiveDataTable } from "@/components/live-data-table";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { getSectionRows } from "@/lib/admin-data";
import { sectionSpecs } from "@/lib/admin-spec";

export async function SectionPage({ sectionKey }: { sectionKey: string }) {
  const role = getCurrentAdminRole();
  const section = sectionSpecs.find((item) => item.key === sectionKey);
  const rows = await getSectionRows(sectionKey);

  if (!section) {
    return <div>Section not configured.</div>;
  }

  return (
    <div>
      <h2>{section.title}</h2>
      <p>{section.summary}</p>
      <LiveDataTable role={role} rows={rows} sectionKey={sectionKey} />
    </div>
  );
}
