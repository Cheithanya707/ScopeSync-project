import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

export function EventExample() {
  return (
    <section className="bg-slate-950 py-20 text-white sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">Event example</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
            Even an event can have scope creep.
          </h2>
        </div>

        <div className="mt-12 rounded-[30px] border border-slate-800 bg-slate-900/80 p-6 shadow-lg sm:p-8" data-animate="fade-up">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">College Hackathon 2026</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">Requirements</h3>
              <ul className="mt-5 space-y-3 text-slate-200">
                {[
                  "Event website",
                  "Registration form",
                  "Participant database",
                  "Payment tracking",
                  "Judges",
                  "Sponsors",
                  "Certificates",
                  "Social media promotion",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-5">
              <div className="flex items-center gap-2 text-red-300">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-xs font-semibold uppercase tracking-[0.22em]">AI alert</p>
              </div>
              <p className="mt-4 text-lg font-medium text-white">New requirement detected</p>
              <p className="mt-2 text-xl font-semibold text-white">“Add live YouTube streaming”</p>
              <div className="mt-5 space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2">
                  <span>Status</span>
                  <span className="font-semibold text-red-300">NEW REQUIREMENT</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2">
                  <span>Affected tasks</span>
                  <span className="font-semibold text-white">2</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2">
                  <span>Additional effort</span>
                  <span className="font-semibold text-white">8 hours</span>
                </div>
              </div>
              <Button asChild className="mt-6 w-full bg-white text-slate-900 hover:bg-slate-100">
                <Link href="/signup">
                  Review Change <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
