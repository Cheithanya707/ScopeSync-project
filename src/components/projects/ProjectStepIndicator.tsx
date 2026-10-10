const defaultSteps = ["Project type", "Details", "Review", "Create"];

export function ProjectStepIndicator({ current, steps = defaultSteps }: { current: number; steps?: string[] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-brand sm:hidden" aria-live="polite">
        Step {Math.min(current, steps.length)} of {steps.length} · {steps[Math.min(current, steps.length) - 1]}
      </p>
      <ol aria-label="Project creation progress" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const number = index + 1;
          const active = number === current;
          const complete = number < current;
          return (
            <li key={step} className="min-w-0" aria-current={active ? "step" : undefined}>
              <div className={`h-1 rounded-full ${active || complete ? "bg-brand" : "bg-slate-200"}`} />
              <p className={`mt-2 hidden truncate text-xs sm:block sm:text-sm ${active ? "font-semibold text-brand" : complete ? "text-slate-700" : "text-slate-500"}`}>
                <span className="mr-1">{complete ? "✓" : `${number}.`}</span> {step}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
