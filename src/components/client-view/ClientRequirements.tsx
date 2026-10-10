import { CheckCircle2 } from "lucide-react";
import type { ClientRequirement } from "@/services/client-view/clientShareData";
import { ClientCard, ClientEmpty, clientHumanize } from "@/components/client-view/ClientViewPrimitives";

export function ClientRequirements({ requirements }: { requirements: ClientRequirement[] }) {
  const approved = requirements.filter((requirement) => requirement.approved === true);
  return <div className="mt-6 space-y-4"><h1 className="text-xl font-semibold text-slate-950">Approved requirements</h1>
    {approved.length === 0 ? <ClientEmpty>No approved requirements are available to share.</ClientEmpty> : approved.map((requirement) => <ClientCard key={requirement.id} title={`${requirement.code} — ${requirement.title}`} icon={CheckCircle2}>
      <dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Requirement ID</dt><dd className="mt-1 text-sm text-slate-800">{requirement.code}</dd></div>{requirement.type && <div><dt className="text-xs text-muted-foreground">Type</dt><dd className="mt-1 text-sm text-slate-800">{clientHumanize(requirement.type)}</dd></div>}{requirement.priority && <div><dt className="text-xs text-muted-foreground">Priority</dt><dd className="mt-1 text-sm text-slate-800">{clientHumanize(requirement.priority)}</dd></div>}<div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1 text-sm text-slate-800">{clientHumanize(requirement.status)}</dd></div></dl>
      {requirement.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{requirement.description}</p>}
      {requirement.acceptanceCriteria && <div className="mt-4 rounded-lg bg-slate-50 p-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Acceptance criteria</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{requirement.acceptanceCriteria}</p></div>}
    </ClientCard>)}
  </div>;
}
