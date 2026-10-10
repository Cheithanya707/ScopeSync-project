import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

export function AIDemo() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center" data-animate="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">AI demo</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            See what ScopeSync can detect.
          </h2>
        </div>

        <div className="mt-12 rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:p-8" data-animate="fade-up">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Client Request</p>
              <p className="mt-4 text-xl font-medium italic text-slate-800">“Can you also add WhatsApp integration?”</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">AI Analysis</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white px-3 py-2">
                  <span className="text-sm text-slate-600">Classification</span>
                  <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600">
                    OUT-OF-SCOPE
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white px-3 py-2">
                  <span className="text-sm text-slate-600">Confidence</span>
                  <span className="font-semibold text-slate-900">94%</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white px-3 py-2">
                  <span className="text-sm text-slate-600">Affected Requirements</span>
                  <span className="font-semibold text-slate-900">R-08</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white px-3 py-2">
                  <span className="text-sm text-slate-600">Affected Tasks</span>
                  <span className="font-semibold text-slate-900">3</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white px-3 py-2">
                  <span className="text-sm text-slate-600">Estimated Effort</span>
                  <span className="font-semibold text-slate-900">12 hours</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white px-3 py-2">
                  <span className="text-sm text-slate-600">Timeline Impact</span>
                  <span className="font-semibold text-slate-900">+2 days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Recommended Action</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">Create a change request before starting this work.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link href="#how-it-works">
                  View Analysis <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Create Change Request</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
