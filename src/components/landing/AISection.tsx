import { BrainCircuit, Eye, Gauge, Sparkles, Telescope, Wand2 } from "lucide-react";
import { Container } from "@/components/layout/Container";

const aiFeatures = [
  { title: "Requirement Understanding", description: "AI analyzes project requirements and converts them into structured information.", icon: BrainCircuit },
  { title: "Change Detection", description: "AI identifies whether a new request is already part of the project or introduces something new.", icon: Eye, badges: ["IN-SCOPE", "OUT-OF-SCOPE", "AMBIGUOUS", "NEW"] },
  { title: "Impact Analysis", description: "Understand which tasks, requirements, deadlines, and costs may be affected by a change.", icon: Gauge },
  { title: "Hidden Work Detection", description: "Identify additional work that may be hidden inside a seemingly small request.", icon: Telescope },
  { title: "Requirement Gap Detection", description: "Find unclear or missing requirements before they become project problems.", icon: Wand2 },
  { title: "Scope Drift Analysis", description: "Understand how much the current project has changed from its original scope.", icon: Sparkles },
];

export function AISection() {
  return (
    <section id="ai" className="bg-[linear-gradient(180deg,_#fff4f4_0%,_#fbfaf9_100%)] py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">AI</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            AI that understands your project.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            ScopeSync doesn&apos;t just store your requirements. It analyzes them and helps you understand what changes mean.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {aiFeatures.map(({ title, description, icon: Icon, badges }) => (
            <div key={title} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_16px_50px_rgba(37,99,235,0.08)]" data-animate="fade-up">
              <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              {badges && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span key={badge} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
