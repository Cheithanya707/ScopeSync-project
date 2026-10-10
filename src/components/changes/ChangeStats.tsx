import { CircleCheck, CircleDashed, CircleDot, ClipboardList, Eye } from "lucide-react";
import type { ScopeChange } from "@/types";

export function ChangeStats({ changes }: { changes: ScopeChange[] }) {
  const stats = [
    { label: "Total Changes", count: changes.length, icon: ClipboardList },
    { label: "New", count: changes.filter((item) => item.status === "new").length, icon: CircleDashed },
    { label: "Under Review", count: changes.filter((item) => item.status === "under_review").length, icon: Eye },
    { label: "Approved", count: changes.filter((item) => item.status === "approved").length, icon: CircleCheck },
    { label: "Implemented", count: changes.filter((item) => item.status === "implemented").length, icon: CircleDot },
  ];
  return <section aria-label="Change statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{stats.map(({ label, count, icon: Icon }) => <div key={label} className="rounded-xl border border-border bg-white p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground sm:text-sm">{label}</p><Icon aria-hidden={true} className="size-4 text-slate-400" /></div><p className="mt-3 text-2xl font-semibold text-slate-950">{count}</p></div>)}</section>;
}
