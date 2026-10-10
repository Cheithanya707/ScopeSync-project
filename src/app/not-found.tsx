import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/src/ui/brand/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <Logo className="mx-auto" href="/" size="md" />
        <p className="mt-6 text-sm font-semibold text-brand">404 · Page not found</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">We can’t find that page</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The link may be incorrect, or the page may have moved.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/"><ArrowLeft aria-hidden="true" />Return to ScopeSync</Link>
        </Button>
      </section>
    </main>
  );
}
