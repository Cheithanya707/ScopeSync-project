"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PROJECT_SHARE_PERMISSIONS } from "@/services/local/projectShareService";
import type { ProjectShare, ProjectSharePermissions, ProjectShareRole } from "@/types";
import { SharePermissions } from "@/components/sharing/SharePermissions";

export function ShareForm({
  projectName,
  initial,
  submitLabel,
  onSave,
  onCancel,
}: {
  projectName: string;
  initial?: ProjectShare;
  submitLabel: string;
  onSave: (data: { email: string; displayName: string; role: ProjectShareRole; permissions: ProjectSharePermissions }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [role, setRole] = useState<ProjectShareRole>(initial?.role ?? "client");
  const [permissions, setPermissions] = useState<ProjectSharePermissions>(initial?.permissions ?? { ...DEFAULT_PROJECT_SHARE_PERMISSIONS });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave({ email, displayName, role, permissions });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Project access could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={(event) => void submit(event)} className="space-y-5 rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
    <div>
      <label htmlFor="share-name" className="mb-1.5 block text-sm font-medium text-slate-800">Name (optional)</label>
      <Input id="share-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={100} disabled={saving} autoComplete="name" />
    </div>
    <div>
      <label htmlFor="share-email" className="mb-1.5 block text-sm font-medium text-slate-800">Email</label>
      <Input id="share-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} disabled={saving || Boolean(initial)} autoComplete="email" />
      {initial && <p className="mt-1 text-xs text-muted-foreground">The email address cannot be changed for an existing share.</p>}
    </div>
    <SharePermissions role={role} onRoleChange={setRole} value={permissions} onChange={setPermissions} disabled={saving} />
    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">Anyone with this link may be able to access the shared project information. Only share it with trusted people.</p>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="flex flex-col-reverse justify-end gap-2 border-t border-border pt-4 sm:flex-row">
      {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>}
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : submitLabel}</Button>
    </div>
    <p className="sr-only">Access will be limited to the selected information for {projectName}.</p>
  </form>;
}
