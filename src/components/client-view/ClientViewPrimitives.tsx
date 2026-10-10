import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function ClientCard({ children, title, icon: Icon }: { children: ReactNode; title: string; icon: LucideIcon }) {
  return <section className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><Icon aria-hidden="true" className="size-5 text-brand" /><h2 className="text-lg font-semibold text-slate-950">{title}</h2></div><div className="mt-4">{children}</div></section>;
}

export function ClientEmpty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">{children}</p>;
}

export function clientHumanize(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function clientDateLabel(value?: string): string {
  if (!value) return "Not set";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date) : "Not set";
}
