import Link from "next/link";
import { ArrowRight, BookOpen, CircleHelp, Files, FolderKanban, ShieldCheck } from "lucide-react";

const topics = [
  {
    question: "Where is my project data stored?",
    answer: "Projects and records are stored by the ScopeSync backend and are available to your signed-in account.",
    icon: Files,
  },
  {
    question: "How do requirements fit into a project?",
    answer: "Write requirements with clear acceptance criteria, then link them to tasks and scope-change requests. Mark a requirement approved only after it has been reviewed.",
    icon: BookOpen,
  },
  {
    question: "How does client access work?",
    answer: "Project shares have explicit permissions and shared documents are opt-in. Shared views are served by the backend and only include data allowed by the share permissions.",
    icon: ShieldCheck,
  },
];

export function HelpCenterPage() {
  return (
    <div>
      <p className="text-sm font-medium text-brand">ScopeSync support</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">How can we help?</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Find a quick answer or jump straight to the workspace area you need.</p>
      <section aria-label="Help topics" className="mt-6 grid gap-3">
        {topics.map(({ question, answer, icon: Icon }) => <article key={question} className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand"><Icon aria-hidden="true" className="size-5" /></span><div><h2 className="font-semibold text-slate-950">{question}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p></div></div>
        </article>)}
      </section>
      <section aria-labelledby="help-shortcuts-title" className="mt-8 rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 id="help-shortcuts-title" className="text-lg font-semibold text-slate-950">Quick links</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <QuickLink href="/projects" label="Browse projects" icon={FolderKanban} />
          <QuickLink href="/requirements" label="Review requirements" icon={BookOpen} />
          <QuickLink href="/settings" label="Workspace settings" icon={CircleHelp} />
          <QuickLink href="/documents" label="Open documents" icon={Files} />
        </div>
      </section>
    </div>
  );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Files }) {
  return <Link href={href} className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><span className="flex items-center gap-3"><Icon aria-hidden="true" className="size-4 text-brand" />{label}</span><ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" /></Link>;
}
