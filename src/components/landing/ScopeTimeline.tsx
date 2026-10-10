import { Container } from "@/components/layout/Container";

export function ScopeTimeline() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Project history</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            Always know what changed.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Every important change is recorded so you can understand the complete history of your project.
          </p>
        </div>

        <div className="mt-12 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8" data-animate="fade-up">
          <ol aria-label="Scope change timeline" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Version 1.0",
              "Original Scope",
              "Change Request #001",
              "Approved",
              "Version 1.1",
              "Change Request #002",
              "Pending Approval",
              "Version 1.2",
            ].map((item, index) => (
              <li key={item + index} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-blue-700">
                  {index + 1}
                </span>
                <span className="min-w-0 break-words text-sm font-medium text-slate-700">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
