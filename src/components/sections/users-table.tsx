"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, MoreHorizontal, Ban, CheckCircle, KeyRound, ShieldAlert, ShieldCheck, FileCheck, ExternalLink } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AdminTable, type Column, SectionHeader, DateCell, IDCell } from "@/components/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { updateUserContact, updateUserCompliance, sendPasswordReset } from "@/app/(admin)/actions";
import { cn } from "@/lib/cn";
import type { AdminRole } from "@/lib/types";

interface UserRow {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  phone: string;
  docs_status: string;
  privacy_violation_flag: boolean;
  account_status: string;
  created_at: string;
  id_photo_url?: string | null;
  driver_license_url?: string | null;
}

function EditUserModal({ user, open, onClose }: { user: UserRow; open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleContact(fd: FormData) {
    startTransition(async () => {
      await updateUserContact(fd);
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`Edit User — ${user.name}`} description={user.email ?? ""} size="lg">
        <form action={handleContact} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" name="first_name" defaultValue={user.first_name} />
            <Input label="Last name" name="last_name" defaultValue={user.last_name} />
          </div>
          <Input label="Email" name="email" type="email" defaultValue={user.email ?? ""} />
          <Input label="Phone" name="phone_number" defaultValue={user.phone_number ?? ""} />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DocVerifyModal({ user, open, onClose }: { user: UserRow; open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [docsStatus, setDocsStatus] = useState(user.docs_status ?? "pending");
  const [privacyFlag, setPrivacyFlag] = useState(String(user.privacy_violation_flag));
  const [accountStatus, setAccountStatus] = useState(user.account_status ?? "active");
  const [note, setNote] = useState("");

  async function handleSubmit() {
    const fd = new FormData();
    fd.append("id", user.id);
    fd.append("docs_verification_status", docsStatus);
    fd.append("privacy_violation_flag", privacyFlag);
    fd.append("account_status", accountStatus);
    fd.append("privacy_violation_notes", note);
    startTransition(async () => {
      await updateUserCompliance(fd);
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Compliance Actions" description={`User: ${user.name}`} size="md">
        <div className="space-y-4">
          <Select
            label="Document verification status"
            value={docsStatus}
            onChange={(e) => setDocsStatus(e.target.value)}
          >
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Select
            label="Account status"
            value={accountStatus}
            onChange={(e) => setAccountStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </Select>
          <Select
            label="Privacy violation flag"
            value={privacyFlag}
            onChange={(e) => setPrivacyFlag(e.target.value)}
          >
            <option value="false">No violation</option>
            <option value="true">Violation flagged</option>
          </Select>
          {privacyFlag === "true" && (
            <Input
              label="Violation notes (internal)"
              name="privacy_violation_notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe the violation…"
            />
          )}
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" loading={isPending} onClick={handleSubmit}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserActions({ row, role }: { row: UserRow; role: AdminRole }) {
  const [editOpen, setEditOpen] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const router = useRouter();
  const isReadOnly = role !== "full_access";

  if (isReadOnly) return <span className="text-xs text-gray-400 italic">Read-only</span>;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil size={12} />
        Edit
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setComplianceOpen(true)}>
        <FileCheck size={12} />
        Compliance
      </Button>

      <DropdownMenu.Root open={dropOpen} onOpenChange={setDropOpen}>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal size={15} />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-44 bg-white rounded-xl border border-gray-100 shadow-lg py-1 text-sm"
            sideOffset={4}
            align="end"
          >
            <DropdownMenu.Item
              onSelect={() => { setDropOpen(false); }}
              className="outline-none"
            >
              <ConfirmDialog
                trigger={
                  <button className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-gray-600 hover:bg-gray-50 cursor-pointer">
                    <KeyRound size={13} className="text-gray-400" />
                    Send password reset
                  </button>
                }
                title="Send password reset?"
                description="An email/notification will be sent to the user to reset their password."
                confirmLabel="Send reset"
                variant="warning"
                action={sendPasswordReset}
                formData={{ id: row.id }}
              />
            </DropdownMenu.Item>
            {row.account_status !== "banned" ? (
              <DropdownMenu.Item className="outline-none">
                <ConfirmDialog
                  trigger={
                    <button className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-red-600 hover:bg-red-50 cursor-pointer">
                      <Ban size={13} />
                      Ban account
                    </button>
                  }
                  title="Ban this account?"
                  description="The user will be immediately suspended and unable to log in or use the platform."
                  confirmLabel="Ban account"
                  action={updateUserCompliance}
                  formData={{ id: row.id, account_status: "banned", docs_verification_status: row.docs_status, privacy_violation_flag: String(row.privacy_violation_flag) }}
                />
              </DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item className="outline-none">
                <ConfirmDialog
                  trigger={
                    <button className="flex items-center gap-2 px-3 py-1.5 w-full text-left text-green-600 hover:bg-green-50 cursor-pointer">
                      <CheckCircle size={13} />
                      Unban account
                    </button>
                  }
                  title="Unban this account?"
                  description="The user will be restored to active status and can use the platform again."
                  confirmLabel="Unban"
                  variant="warning"
                  action={updateUserCompliance}
                  formData={{ id: row.id, account_status: "active", docs_verification_status: row.docs_status, privacy_violation_flag: String(row.privacy_violation_flag) }}
                />
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <EditUserModal user={row} open={editOpen} onClose={() => setEditOpen(false)} />
      <DocVerifyModal user={row} open={complianceOpen} onClose={() => setComplianceOpen(false)} />
    </>
  );
}

const columns: Column<UserRow>[] = [
  {
    key: "name",
    header: "User",
    render: (row) => (
      <div>
        <p className="font-medium text-gray-900">{row.name || "Unknown"}</p>
        <p className="text-xs text-gray-400 mt-0.5">{row.email}</p>
      </div>
    ),
  },
  {
    key: "phone",
    header: "Phone",
    render: (row) => (
      <span className="text-gray-600 font-mono text-xs">{row.phone || <span className="text-gray-400">—</span>}</span>
    ),
  },
  {
    key: "role",
    header: "Role",
    width: "80px",
    render: () => <Badge status="guest" />,
  },
  {
    key: "docs_status",
    header: "Docs",
    width: "180px",
    render: (row) => (
      <div className="space-y-1">
        <Badge status={row.docs_status ?? "missing"} dot />
        <div className="flex flex-col gap-0.5 text-xs">
          {row.id_photo_url ? (
            <a href={row.id_photo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700">
              ID photo <ExternalLink size={10} />
            </a>
          ) : null}
          {row.driver_license_url ? (
            <a href={row.driver_license_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700">
              Driver license <ExternalLink size={10} />
            </a>
          ) : null}
          {!row.id_photo_url && !row.driver_license_url ? <span className="text-gray-400">No files</span> : null}
        </div>
      </div>
    ),
  },
  {
    key: "privacy_violation_flag",
    header: "Privacy",
    width: "100px",
    render: (row) =>
      row.privacy_violation_flag ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
          <ShieldAlert size={12} />
          Flagged
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <ShieldCheck size={12} />
          OK
        </span>
      ),
  },
  {
    key: "account_status",
    header: "Account",
    width: "100px",
    render: (row) => <Badge status={row.account_status ?? "active"} dot />,
  },
  {
    key: "links",
    header: "Public Links",
    render: (row) => (
      <a
        href={row.admin_open_profile_url ?? "#"}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
      >
        Profile <ExternalLink size={11} />
      </a>
    ),
  },
  {
    key: "created_at",
    header: "Joined",
    render: (row) => <DateCell value={row.created_at} />,
  },
];

export function UsersTable({ rows, role }: { rows: UserRow[]; role: AdminRole }) {
  return (
    <div>
      <SectionHeader
        title="Users"
        description="Manage accounts, verify documents, handle compliance and privacy violations."
      />
      <AdminTable
        columns={columns}
        rows={rows}
        renderActions={(row) => <UserActions row={row} role={role} />}
        searchFn={(row, q) =>
          row.name.toLowerCase().includes(q) ||
          String(row.email ?? "").toLowerCase().includes(q) ||
          String(row.phone ?? "").includes(q)
        }
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "banned", label: "Banned" },
        ]}
        statusKey="account_status"
        dateKey="created_at"
        emptyMessage="No users found."
      />
    </div>
  );
}
