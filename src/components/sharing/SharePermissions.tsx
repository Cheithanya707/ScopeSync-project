"use client";

import type { ProjectSharePermissions, ProjectShareRole } from "@/types";

const permissions: { key: keyof ProjectSharePermissions; label: string; available: boolean }[] = [
  { key: "viewProject", label: "View project overview", available: true },
  { key: "viewRequirements", label: "View approved requirements", available: true },
  { key: "viewTasks", label: "View selected tasks", available: true },
  { key: "viewChanges", label: "View shared changes", available: true },
  { key: "viewCalendar", label: "View project calendar", available: true },
  { key: "viewDocuments", label: "View documents marked as shared", available: true },
  { key: "viewPayments", label: "View project payments", available: true },
  { key: "submitChangeRequest", label: "Submit a change request", available: true },
  { key: "approveChanges", label: "Approve or reject changes", available: true },
  { key: "comment", label: "Comments (coming later)", available: false },
];

export const SHARE_ROLES: { value: ProjectShareRole; label: string }[] = [
  { value: "client", label: "Client" },
  { value: "stakeholder", label: "Stakeholder" },
  { value: "event_organizer", label: "Event Organizer" },
  { value: "reviewer", label: "Reviewer" },
];

export function SharePermissions({
  role,
  onRoleChange,
  value,
  onChange,
  disabled = false,
}: {
  role: ProjectShareRole;
  onRoleChange: (role: ProjectShareRole) => void;
  value: ProjectSharePermissions;
  onChange: (permissions: ProjectSharePermissions) => void;
  disabled?: boolean;
}) {
  return <div className="space-y-5">
    <div>
      <label htmlFor="share-role" className="mb-1.5 block text-sm font-medium text-slate-800">Role</label>
      <select id="share-role" value={role} onChange={(event) => onRoleChange(event.target.value as ProjectShareRole)} disabled={disabled} className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
        {SHARE_ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </div>
    <fieldset>
      <legend className="text-sm font-medium text-slate-800">What can this person access?</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {permissions.map(({ key, label, available }) => <label key={key} className={`flex items-start gap-2.5 rounded-lg border border-border p-3 text-sm ${available ? "text-slate-700" : "text-slate-400"}`}>
          <input
            type="checkbox"
            checked={value[key] === true}
            disabled={disabled || !available}
            onChange={(event) => onChange({ ...value, [key]: event.target.checked })}
            className="mt-0.5 size-4 accent-brand"
          />
          <span>{label}</span>
        </label>)}
      </div>
    </fieldset>
  </div>;
}
