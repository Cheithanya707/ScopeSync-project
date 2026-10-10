import { BriefcaseBusiness, Building2, CalendarCheck2, Users, Video, Wand2 } from "lucide-react";
import { Container } from "@/components/layout/Container";

const useCases = [
  { label: "Freelancers", icon: BriefcaseBusiness },
  { label: "Agencies", icon: Building2 },
  { label: "Events", icon: CalendarCheck2 },
  { label: "College Teams", icon: Users },
  { label: "Organizations", icon: Wand2 },
  { label: "Creative Teams", icon: Video },
];

export function TrustStrip() {
  return (
    <section className="border-y border-slate-200 bg-white/70 py-6">
      <Container>
        <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Built for all kinds of project-based work
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {useCases.map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
              <Icon className="h-4 w-4 text-blue-700" />
              {label}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
