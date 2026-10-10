"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types";

export function AssignProjectDialog({
  open,
  projects,
  assignedIds,
  onCancel,
  onAssign,
}: {
  open: boolean;
  projects: Project[];
  assignedIds: string[];
  onCancel: () => void;
  onAssign: (projectId: string) => Promise<void>;
}) {
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  const available = projects.filter((project) => !assignedIds.includes(project.id));
  const submit = async () => {
    if (!projectId) return;
    setBusy(true);
    setError("");
    try {
      await onAssign(projectId);
      setProjectId("");
    } catch {
      setError("Unable to assign this project. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }} onKeyDown={(event) => { if (event.key === "Escape" && !busy) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="assign-project-title" className="w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-xl sm:p-6">
        <h2 id="assign-project-title" className="text-lg font-semibold text-slate-950">Assign to Project</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose a project in this workspace.</p>
        {available.length ? <select aria-label="Select project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-5 h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><option value="">Select project</option>{available.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select> : <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-muted-foreground">All workspace projects are already assigned.</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button><Button type="button" onClick={() => void submit()} disabled={!projectId || busy}>{busy ? "Assigning..." : "Assign"}</Button></div>
      </section>
    </div>
  );
}
