"use client";

import type { SectionSpec } from "@/lib/types";
import { canRunDestructiveAction } from "@/lib/admin-auth";
import type { AdminRole } from "@/lib/types";
import styles from "./spec-table.module.css";

const destructiveKeywords = ["ban", "refund", "remove", "release"];

function toneClass(tone: string | undefined) {
  if (!tone) {
    return styles.neutral;
  }
  return styles[tone as keyof typeof styles] ?? styles.neutral;
}

export function SpecTable({ section, role }: { section: SectionSpec; role: AdminRole }) {
  function handleAction(actionText: string) {
    const isDestructive = destructiveKeywords.some((value) => actionText.toLowerCase().includes(value));
    if (isDestructive) {
      if (!canRunDestructiveAction(role)) {
        window.alert("This action requires full-access admin role.");
        return;
      }
      const confirmed = window.confirm(`Confirm destructive action?\n\n${actionText}`);
      if (!confirmed) {
        return;
      }
    }
    window.alert(`Action queued (placeholder): ${actionText}`);
  }

  return (
    <section className={styles.tableWrap}>
      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="Search by name / ID / identifier" />
        <select className={styles.select} defaultValue="">
          <option value="" disabled>
            Filter by status
          </option>
          <option>All statuses</option>
          <option>Pending</option>
          <option>Active</option>
          <option>Suspended</option>
        </select>
        <select className={styles.select} defaultValue="">
          <option value="" disabled>
            Date range
          </option>
          <option>Today</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
        </select>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Column</th>
            <th>Visual indicator</th>
            <th>Admin action</th>
          </tr>
        </thead>
        <tbody>
          {section.columns.map((column) => (
            <tr key={column.label}>
              <td>{column.label}</td>
              <td>
                {column.indicator ? (
                  <span className={`${styles.badge} ${toneClass(column.tone)}`}>{column.indicator}</span>
                ) : (
                  "-"
                )}
              </td>
              <td>
                {column.action ? (
                  <button
                    className={column.action.toLowerCase().match(/ban|refund|remove|release/) ? styles.danger : ""}
                    onClick={() => handleAction(column.action ?? "")}
                    type="button"
                  >
                    {column.action}
                  </button>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <span>Rows per page: 25</span>
        <span>Page 1 of N</span>
      </div>
    </section>
  );
}
