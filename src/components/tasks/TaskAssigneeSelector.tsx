"use client";

import type { WorkspaceMember } from "@/types";

export function TaskAssigneeSelector({
  value,
  onChange,
  currentUserId,
  currentUserLabel,
  members,
}: {
  value: string;
  onChange: (value: string) => void;
  currentUserId: string;
  currentUserLabel: string;
  members: WorkspaceMember[];
}) {
  const availableMembers = members;
  const currentUserIsListed = availableMembers.some((member) => member.userId === currentUserId || member.id === currentUserId);
  return (
    <div>
      <label htmlFor="task-assignee" className="mb-1.5 block text-sm font-medium text-slate-800">Assignee <span className="font-normal text-slate-500">(optional)</span></label>
      <select id="task-assignee" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <option value="">Unassigned</option>
        {availableMembers.map((member) => <option key={member.id} value={member.userId || member.id}>{member.displayName}</option>)}
        {currentUserId && !currentUserIsListed && <option value={currentUserId}>{currentUserLabel || "Current user (you)"}</option>}
      </select>
    </div>
  );
}
