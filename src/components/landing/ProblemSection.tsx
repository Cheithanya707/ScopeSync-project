import { AlertTriangle, Clock3, FileWarning, Mail } from "lucide-react";
import { Container } from "@/components/layout/Container";

const cards = [
  { icon: Mail, title: "Requests get lost", description: "Important changes can arrive through emails, messages, meetings, or documents and easily get missed." },
  { icon: AlertTriangle, title: "Scope keeps changing", description: "Small additional requests can slowly increase the amount of work." },
  { icon: Clock3, title: "Deadlines move", description: "Unplanned work can increase effort and push the project timeline." },
  { icon: FileWarning, title: "No clear history", description: "It can be difficult to understand what was originally agreed and what changed later." },
];

export function ProblemSection() {
  return (
    <section id="features" className="py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">The problem</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            Small changes can create big problems.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Projects often become difficult to manage when requirements, tasks, client requests,
            documents, and deadlines are scattered across different tools.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-animate="fade-up">
              <div className="inline-flex rounded-xl bg-slate-100 p-3 text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
