"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MEMBER_ROLES, MEMBER_STATUSES } from "@/lib/constants/people";
import type { WorkspaceMember, WorkspaceMemberRole, WorkspaceMemberStatus } from "@/types";
import type { WorkspaceMemberInput } from "@/services/people/memberStore";

type MemberFormValues = {
  displayName: string;
  email: string;
  role: WorkspaceMemberRole;
  status: WorkspaceMemberStatus;
  photoURL: string;
};

export function MemberForm({
  member,
  currentUser,
  onSubmit,
  cancelHref,
}: {
  member?: WorkspaceMember;
  currentUser?: { uid?: string; email?: string | null };
  onSubmit: (values: WorkspaceMemberInput | Pick<WorkspaceMember, "displayName" | "role" | "status">) => Promise<void>;
  cancelHref: string;
}) {
  const [values, setValues] = useState<MemberFormValues>({
    displayName: member?.displayName ?? "",
    email: member?.email ?? "",
    role: member?.role ?? "team_member",
    status: member?.status ?? "active",
    photoURL: member?.photoURL ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const displayName = values.displayName.trim();
    const email = values.email.trim().toLowerCase();
    if (displayName.length < 2) return setError("Enter a name with at least 2 characters.");
    if (!member && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (values.photoURL && (!URL.canParse(values.photoURL) || !["http:", "https:"].includes(new URL(values.photoURL).protocol))) return setError("Enter a valid http or https profile photo URL.");
    setError("");
    setSaving(true);
    try {
      if (member) {
        await onSubmit({ displayName, role: values.role, status: values.status });
      } else {
        await onSubmit({
          displayName,
          email,
          role: values.role,
          status: values.status,
          ...(values.photoURL ? { photoURL: values.photoURL.trim() } : {}),
          ...(currentUser?.uid && email === currentUser.email?.toLowerCase() ? { userId: currentUser.uid } : {}),
        });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save this person. Please try again.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="mt-7 rounded-xl border border-border bg-white p-5 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="member-name" className="mb-1.5 block text-sm font-medium text-slate-800">Full name</label>
          <Input id="member-name" required maxLength={100} autoComplete="name" value={values.displayName} onChange={(event) => setValues({ ...values, displayName: event.target.value })} />
        </div>
        {!member && <div className="sm:col-span-2">
          <label htmlFor="member-email" className="mb-1.5 block text-sm font-medium text-slate-800">Email</label>
          <Input id="member-email" type="email" required maxLength={254} autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
        </div>}
        {member && <div className="sm:col-span-2">
          <label htmlFor="member-email-readonly" className="mb-1.5 block text-sm font-medium text-slate-800">Email</label>
          <Input id="member-email-readonly" type="email" value={member.email} disabled />
          <p className="mt-1 text-xs text-muted-foreground">Email is not editable in this preview.</p>
        </div>}
        <div>
          <label htmlFor="member-role" className="mb-1.5 block text-sm font-medium text-slate-800">Role</label>
          <select id="member-role" value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value as WorkspaceMemberRole })} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {MEMBER_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="member-status" className="mb-1.5 block text-sm font-medium text-slate-800">Status</label>
          <select id="member-status" value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value as WorkspaceMemberStatus })} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {MEMBER_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </div>
        {!member && <div className="sm:col-span-2">
          <label htmlFor="member-photo" className="mb-1.5 block text-sm font-medium text-slate-800">Profile photo URL <span className="font-normal text-slate-500">(optional)</span></label>
          <Input id="member-photo" type="url" maxLength={2048} value={values.photoURL} onChange={(event) => setValues({ ...values, photoURL: event.target.value })} />
        </div>}
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row">
        <Button asChild type="button" variant="outline"><Link href={cancelHref}>Cancel</Link></Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : member ? "Save Changes" : "Add Person"}</Button>
      </div>
    </form>
  );
}
