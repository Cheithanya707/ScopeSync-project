import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { isLocalDataAvailable } from "@/lib/localData";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const benefits = [
  "Track requirements clearly",
  "Detect scope drift early",
  "Keep stakeholders aligned",
];

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="auth-page relative isolate min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="auth-background" aria-hidden="true">
      </div>

      <Container className="relative z-10 flex min-h-screen max-w-7xl flex-col justify-center py-7 sm:py-10">
        <div className="auth-layout-grid mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-[minmax(0,1fr)_minmax(21rem,0.92fr)] md:items-center md:gap-8 lg:gap-16">
          <section aria-label="About ScopeSync" className="min-w-0 md:py-8">
            <Logo className="auth-layout-logo" />
            <div className="mt-4 max-w-xl sm:mt-7 md:mt-10 lg:mt-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-accent/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-brand-dark dark:text-brand">
                <Sparkles aria-hidden="true" className="size-3.5" />
                AI-powered project clarity
              </p>
              <h1 className="mt-5 max-w-xl text-3xl font-semibold leading-[1.08] tracking-[-0.055em] text-foreground sm:text-4xl lg:text-5xl">
                ScopeSync keeps every project <span className="text-brand">in sync.</span>
              </h1>
              <p className="mt-4 hidden max-w-lg text-sm leading-6 text-muted-foreground sm:block sm:text-base sm:leading-7">
                Keep projects, requirements, changes, and decisions aligned from kickoff to delivery.
              </p>
            </div>

            <ul className="mt-6 hidden gap-2.5 sm:grid sm:grid-cols-3 md:mt-8 md:grid-cols-1 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="auth-value-card flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/75 px-3 py-2.5 text-xs font-medium text-foreground sm:text-sm">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-brand">
                    <Check aria-hidden="true" className="size-3.5" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
            <p className="mt-6 hidden text-xs tracking-wide text-muted-foreground md:block">
              One clear view of the work, from the first brief to the final handoff.
            </p>
          </section>

          <section aria-labelledby="auth-title" className="w-full min-w-0 md:justify-self-end">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to home
            </Link>
            <div className="auth-panel w-full rounded-3xl border border-border/90 bg-card p-5 shadow-[0_24px_80px_rgb(15_23_42_/_0.08)] sm:p-8">
              <h2 id="auth-title" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
              <div className="mt-6">{children}</div>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {isLocalDataAvailable
                  ? "Your account is securely managed by the ScopeSync backend."
                  : "Standalone preview: your session stays in this browser; no account is created on a server."}
              </p>
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}
