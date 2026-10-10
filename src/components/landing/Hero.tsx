import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquareWarning, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-12 sm:pb-20 lg:pt-20">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_60%)]" />
      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div data-animate="fade-up" className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
              AI-powered project and requirement management.
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
              Manage Every Requirement.
              <span className="block text-slate-700">Never Miss a Change.</span>
            </h1>
            <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
              ScopeSync helps freelancers, teams, organizations, and event organizers manage projects,
              track requirements, detect changes, and understand their impact with AI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Plan better.</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Track clearly.</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Understand every change.</span>
            </div>
          </div>

          <div data-animate="fade-up" className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div data-hero-float="true" className="relative rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-slate-100">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Project Overview</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">Marketing Launch</h2>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">72%</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Progress</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">72%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Requirements</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">18/24</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Tasks</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">32/41</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-white p-2 text-blue-700 shadow-sm"><MessageSquareWarning className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-700">AI Alert</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">New requirement detected</p>
                    </div>
                  </div>
                  <p className="mt-3 text-lg font-medium text-slate-800">“Add WhatsApp integration”</p>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-white px-3 py-2">
                      <span>Affected tasks</span>
                      <span className="font-semibold text-slate-900">3</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-white px-3 py-2">
                      <span>Timeline impact</span>
                      <span className="font-semibold text-slate-900">+2 days</span>
                    </div>
                  </div>
                  <button type="button" className="mt-4 inline-flex items-center rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                    View Analysis
                  </button>
                </div>
              </div>
            </div>
            <div className="absolute -left-6 top-10 hidden rounded-full border border-blue-200 bg-white px-2.5 py-2 text-xs font-medium text-blue-700 shadow-lg sm:flex">
              <Radio className="mr-2 h-4 w-4" /> Real-time alerts
            </div>
            <div className="absolute -bottom-4 right-4 hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 shadow-lg sm:flex">
              Updated scope ready
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
