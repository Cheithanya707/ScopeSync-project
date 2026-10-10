import { CalendarDays } from "lucide-react";

export function CalendarEmptyState() {
  return <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand"><CalendarDays aria-hidden={true} className="size-6" /></span>
    <h2 className="mt-4 text-lg font-semibold text-slate-950">No upcoming dates</h2>
    <p className="mt-2 text-sm text-muted-foreground">Project deadlines, task due dates and scope changes will appear here.</p>
  </section>;
}
