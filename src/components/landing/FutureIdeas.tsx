import { Container } from "@/components/layout/Container";

export function FutureIdeas() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Future ideas</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            Not ready now? Save it for later.
          </h2>
        </div>

        <div className="mt-12 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8" data-animate="fade-up">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              "Mobile Application",
              "AI Recommendation System",
              "Advanced Analytics",
              "WhatsApp Automation",
            ].map((idea) => (
              <div key={idea} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-base font-semibold text-slate-900">{idea}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                <p className="mt-2 text-sm font-medium text-slate-700">Saved for Version 2</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-slate-600">
            Keep useful ideas separate from the current scope so they don&apos;t silently become unplanned work.
          </p>
        </div>
      </Container>
    </section>
  );
}
