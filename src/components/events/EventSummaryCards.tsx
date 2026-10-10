import { CalendarDays, ClipboardList, FileText, UsersRound, WalletCards } from "lucide-react";

export function EventSummaryCards({ participants, teams, tasks, requirements, payments, documents }: {
  participants: number;
  teams: number;
  tasks: number;
  requirements: number | null;
  payments: number;
  documents: number;
}) {
  const cards = [
    { label: "Participants", value: String(participants), icon: UsersRound },
    { label: "Teams", value: String(teams), icon: UsersRound },
    { label: "Pending tasks", value: String(tasks), icon: ClipboardList },
    { label: "Requirements", value: requirements === null ? "Unavailable" : String(requirements), icon: FileText },
    { label: "Payments", value: String(payments), icon: WalletCards },
    { label: "Documents", value: String(documents), icon: CalendarDays },
  ];
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(({ label, value, icon: Icon }) => <article key={label} className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-sm"><span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-brand"><Icon aria-hidden="true" className="size-5" /></span><div><p className="text-xs text-slate-500">{label}</p><p className="mt-0.5 text-lg font-semibold text-slate-950">{value}</p></div></article>)}</div>;
}
