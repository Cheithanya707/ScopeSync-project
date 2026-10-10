"use client";

import { useState } from "react";
import { MemberAvatar } from "@/components/people/MemberAvatar";
import { Button } from "@/components/ui/button";
import { memberStatusLabel } from "@/lib/constants/people";
import type { WorkspaceMember } from "@/types";

export function AddTeamMemberDialog({
  open,
  members,
  assignedIds,
  onCancel,
  onAssign,
}: {
  open: boolean;
  members: WorkspaceMember[];
  assignedIds: string[];
  onCancel: () => void;
  onAssign: (memberIds: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  const close = () => {
    setSelected([]);
    setError("");
    onCancel();
  };
  const available = members.filter((member) => !assignedIds.includes(member.id));
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onAssign(selected);
      close();
    } catch {
      setError("Unable to add these people to the team. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) close(); }} onKeyDown={(event) => { if (event.key === "Escape" && !busy) close(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="add-team-members-title" className="w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-xl sm:p-6">
        <h2 id="add-team-members-title" className="text-lg font-semibold text-slate-950">Add Team Members</h2>
        <p className="mt-1 text-sm text-muted-foreground">Select active people from this workspace.</p>
        <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
          {available.map((member) => <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-slate-50">
            <input type="checkbox" checked={selected.includes(member.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, member.id] : current.filter((id) => id !== member.id))} className="size-4 accent-blue-700" />
            <MemberAvatar name={member.displayName} photoURL={member.photoURL} size="sm" />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{member.displayName} <span className="font-normal text-muted-foreground">· {memberStatusLabel(member.status)}</span></span><span className="block truncate text-xs text-muted-foreground">{member.email}</span></span>
          </label>)}
          {!available.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">Everyone in this workspace is already assigned to the project.</p>}
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={close} disabled={busy}>Cancel</Button><Button type="button" onClick={() => void submit()} disabled={!selected.length || busy}>{busy ? "Adding..." : `Add ${selected.length ? `(${selected.length})` : "Members"}`}</Button></div>
      </section>
    </div>
  );
}
