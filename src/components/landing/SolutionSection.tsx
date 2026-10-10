import { ArrowDown, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/Container";

const workflow = [
  "Original Requirements",
  "Project Tasks",
  "New Request",
  "AI Analysis",
  "Impact Assessment",
  "Approval",
  "Updated Scope",
];

export function SolutionSection() {
  return (
    <section className="bg-slate-950 py-20 text-white sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">The solution</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
            One place to understand your entire project.
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            ScopeSync brings requirements, tasks, changes, deadlines, documents, and project activity
            into one workspace.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 xl:flex-row xl:justify-center xl:gap-3" data-animate="fade-up">
          {workflow.map((item, index) => (
            <div key={item} className="flex items-center gap-3 xl:max-w-none">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-100 shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                {item}
              </div>
              {index < workflow.length - 1 && <ArrowDown className="hidden h-5 w-5 text-slate-500 xl:block" />}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
