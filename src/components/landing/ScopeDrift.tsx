import { Container } from "@/components/layout/Container";

export function ScopeDrift() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Scope evolution</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            See how your scope evolves.
          </h2>
        </div>

        <div className="mt-12 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8" data-animate="fade-up">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { label: "Original Scope", value: 100 },
              { label: "Current Scope", value: 128 },
              { label: "Scope Growth", value: "+28%" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 h-36 rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="flex h-full items-end gap-4">
              {[40, 60, 74, 82, 98, 118, 128].map((height, index) => (
                <div key={height} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className={`w-full rounded-t-2xl ${index === 6 ? "bg-blue-600" : index === 5 ? "bg-blue-400" : "bg-slate-300"}`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
