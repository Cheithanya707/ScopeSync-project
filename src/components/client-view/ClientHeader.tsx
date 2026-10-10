import { Logo } from "@/src/ui/brand/Logo";

export function ClientHeader({ projectName }: { projectName: string }) {
  return <header className="border-b border-border bg-white">
    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="min-w-0"><Logo href="/" size="sm" /><p className="mt-1 truncate text-lg font-semibold text-slate-950 sm:text-xl">{projectName}</p></div>
      <span className="shrink-0 rounded-full border border-brand/20 bg-blue-50 px-3 py-1 text-xs font-medium text-brand">Client View</span>
    </div>
  </header>;
}
