import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col py-6 sm:py-10">
      <Container className="max-w-6xl">
        <Logo />
        <div className="mx-auto mt-10 w-full max-w-md sm:mt-14">
          <Link
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-slate-950"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to home
          </Link>
          <section className="mt-5 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            <div className="mt-7">{children}</div>
          </section>
        </div>
      </Container>
    </main>
  );
}
