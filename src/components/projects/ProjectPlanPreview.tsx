import { CircleHelp, ListChecks, Sparkles } from "lucide-react";
import type { ProjectAIPlan } from "@/types";

export function ProjectPlanPreview({ plan }: { plan: ProjectAIPlan }) {
  return (
    <section aria-labelledby="project-plan-title">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-brand"><Sparkles aria-hidden="true" className="size-5" /></span>
        <div>
          <h2 id="project-plan-title" className="text-lg font-semibold text-foreground">Your project plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">{plan.provider === "gemini" ? "AI-generated draft" : "Starter plan"} · Review and adjust this plan with your team.</p>
        </div>
      </div>
      {plan.provider === "rules" && (
        <p role="note" className="mt-4 rounded-xl border border-border bg-muted px-4 py-3 text-xs leading-5 text-muted-foreground">
          The AI provider is not configured, so this is a practical starter template based on your project details.
        </p>
      )}
      <p className="mt-5 rounded-2xl border border-border bg-card p-4 text-sm leading-6 text-foreground">{plan.summary}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PlanList title="Suggested requirements" icon={ListChecks} items={plan.requirements} />
        <PlanList title="Recommended steps" icon={Sparkles} items={plan.steps} />
      </div>
      {plan.openQuestions.length > 0 && (
        <PlanList className="mt-4" title="Questions to confirm" icon={CircleHelp} items={plan.openQuestions} />
      )}
    </section>
  );
}

function PlanList({
  title,
  icon: Icon,
  items,
  className = "",
}: {
  title: string;
  icon: typeof ListChecks;
  items: string[];
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-4 ${className}`}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon aria-hidden="true" className="size-4 text-brand" />{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-muted-foreground"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />{item}</li>)}
      </ul>
    </section>
  );
}
