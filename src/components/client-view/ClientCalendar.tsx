import { CalendarDays } from "lucide-react";
import type { ClientCalendarDate } from "@/services/client-view/clientShareData";
import { ClientCard, ClientEmpty, clientDateLabel } from "@/components/client-view/ClientViewPrimitives";

export function ClientCalendar({ dates }: { dates: ClientCalendarDate[] }) {
  return <ClientCard title="Project dates" icon={CalendarDays}>{dates.length === 0 ? <ClientEmpty>No shared project dates are scheduled.</ClientEmpty> : <ul className="divide-y divide-border">{dates.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"><span className="font-medium text-slate-900">{item.title}</span><span className="text-sm text-slate-600">{clientDateLabel(item.date)}</span></li>)}</ul>}</ClientCard>;
}
