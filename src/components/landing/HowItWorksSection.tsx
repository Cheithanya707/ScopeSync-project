import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/Container";

const steps = [
  { number: "01", title: "Create", description: "Create a project or event." },
  { number: "02", title: "Define", description: "Add the original requirements and scope." },
  { number: "03", title: "Manage", description: "Track tasks, people, deadlines, and progress." },
  { number: "04", title: "Analyze", description: "AI analyzes new requests and identifies changes." },
  { number: "05", title: "Control", description: "Approve changes and maintain an updated scope history." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">How it works</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            A simple workflow for smart project control.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5" data-animate="fade-up">
          {steps.map(({ number, title, description }) => (
            <div key={title} className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">{number}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              {number !== "05" && <ArrowRight className="mt-6 h-4 w-4 text-slate-300" />}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
