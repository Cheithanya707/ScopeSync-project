import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,_#ffffff,_#eff6ff)] p-8 shadow-[0_24px_80px_rgba(37,99,235,0.08)] sm:p-12" data-animate="fade-up">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Start now</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
              Take control of every project change.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Start managing your requirements, tasks, and project changes with ScopeSync.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">No credit card required.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
