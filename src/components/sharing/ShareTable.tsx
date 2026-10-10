"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareForm } from "@/components/sharing/ShareForm";
import { ShareStatusBadge } from "@/components/sharing/ShareStatusBadge";
import type { ProjectShare, ProjectSharePermissions, ProjectShareRole } from "@/types";

function dateLabel(value: unknown): string {
  if (!value) return "Never";
  const date = typeof value === "string"
    ? new Date(value)
    : typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function"
      ? value.toDate()
      : null;
  return date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)
    : "Never";
}

export function ShareTable({
  shares,
  projectName,
  editing,
  busyId,
  onEdit,
  onStatusChange,
  onSave,
  onCancel,
}: {
  shares: ProjectShare[];
  projectName: string;
  editing: string | null;
  busyId: string;
  onEdit: (id: string) => void;
  onStatusChange: (share: ProjectShare) => void;
  onSave: (shareId: string, data: { displayName: string; role: ProjectShareRole; permissions: ProjectSharePermissions }) => Promise<void>;
  onCancel: () => void;
}) {
  return <div className="overflow-x-auto">
    <table className="w-full min-w-[850px] text-left text-sm">
      <thead className="bg-slate-50 text-xs text-muted-foreground"><tr>
        <th scope="col" className="px-4 py-3 font-medium">Person</th><th scope="col" className="px-4 py-3 font-medium">Role</th><th scope="col" className="px-4 py-3 font-medium">Status</th><th scope="col" className="px-4 py-3 font-medium">Permissions</th><th scope="col" className="px-4 py-3 font-medium">Last Accessed</th><th scope="col" className="px-4 py-3 font-medium">Actions</th>
      </tr></thead>
      <tbody className="divide-y divide-border">{shares.map((share) => <FragmentRows key={share.id} share={share} projectName={projectName} editing={editing === share.id} busy={busyId === share.id} onEdit={() => onEdit(share.id)} onStatusChange={() => onStatusChange(share)} onSave={(data) => onSave(share.id, data)} onCancel={onCancel} />)}</tbody>
    </table>
  </div>;
}

function FragmentRows({
  share,
  projectName,
  editing,
  busy,
  onEdit,
  onStatusChange,
  onSave,
  onCancel,
}: {
  share: ProjectShare;
  projectName: string;
  editing: boolean;
  busy: boolean;
  onEdit: () => void;
  onStatusChange: () => void;
  onSave: (data: { email: string; displayName: string; role: ProjectShareRole; permissions: ProjectSharePermissions }) => Promise<void>;
  onCancel: () => void;
}) {
  return <>
    <tr>
      <th scope="row" className="px-4 py-4 font-medium text-slate-900"><span className="block">{share.displayName || share.email}</span><span className="mt-1 block font-normal text-slate-600">{share.email}</span></th>
      <td className="px-4 py-4 capitalize text-slate-700">{share.role.replaceAll("_", " ")}</td>
      <td className="px-4 py-4"><ShareStatusBadge status={share.status} /></td>
      <td className="px-4 py-4 text-slate-700">{Object.values(share.permissions).filter(Boolean).length} permissions</td>
      <td className="px-4 py-4 text-slate-600">{dateLabel(share.lastAccessedAt)}</td>
      <td className="px-4 py-4"><div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>Edit</Button>
        {share.status === "revoked"
          ? <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onStatusChange}><RotateCcw aria-hidden="true" />Restore</Button>
          : <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={onStatusChange}><Trash2 aria-hidden="true" />Revoke</Button>}
      </div></td>
    </tr>
    {editing && <tr><td colSpan={6} className="bg-slate-50 p-4"><ShareForm projectName={projectName} initial={share} submitLabel="Save access" onCancel={onCancel} onSave={onSave} /></td></tr>}
  </>;
}
