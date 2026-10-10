import {
  AlertCircle,
  ArrowUpRight,
  FileSpreadsheet,
  FolderOpen,
  HardDrive,
  Mail,
  PlugZap,
  ShieldCheck,
} from "lucide-react";

const connectors = [
  {
    name: "Gmail",
    description: "Bring email context into your project workflow.",
    icon: Mail,
    iconClass: "bg-red-50 text-red-600",
  },
  {
    name: "Google Sheets",
    description: "Work with project plans, trackers, and shared spreadsheets.",
    icon: FileSpreadsheet,
    iconClass: "bg-emerald-50 text-emerald-700",
  },
  {
    name: "Google Drive",
    description: "Find and reference the files your team keeps in Drive.",
    icon: HardDrive,
    iconClass: "bg-blue-50 text-blue-700",
  },
  {
    name: "Local files",
    description: "Use files on this device through a configured MCP server.",
    icon: FolderOpen,
    iconClass: "bg-amber-50 text-amber-700",
  },
];

export default function McpPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-brand">
            <PlugZap aria-hidden="true" className="size-4" />
            Workspace connections
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            MCP integrations
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Connect the tools and files you use every day to your ScopeSync
            workspace.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <span aria-hidden="true" className="size-2 rounded-full bg-slate-400" />
          0 connected
        </span>
      </div>

      <section
        aria-label="Available integrations"
        className="mt-7 grid gap-4 sm:grid-cols-2"
      >
        {connectors.map(({ name, description, icon: Icon, iconClass }) => (
          <article
            key={name}
            className="flex min-h-52 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
              >
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Not connected
              </span>
            </div>
            <h2 className="mt-5 text-base font-semibold text-slate-950">{name}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            <div className="mt-auto flex justify-end pt-5">
              <button
                type="button"
                disabled
                aria-label={`${name}: connection unavailable until backend MCP setup`}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 text-sm font-medium text-muted-foreground"
              >
                Backend required
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </article>
        ))}
      </section>

      <section
        aria-labelledby="mcp-setup-title"
        className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-amber-700"
          />
          <div>
            <h2
              id="mcp-setup-title"
              className="font-semibold text-amber-950"
            >
              Connections aren&apos;t active yet
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              This frontend-only screen does not sign in to Google or access
              local files. Live connections need a trusted backend MCP service
              and, for Google apps, OAuth authorization. No account data is
              being accessed or stored here.
            </p>
          </div>
        </div>
      </section>

      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        You&apos;ll be able to review permissions before authorizing any
        connection once backend setup is available.
      </p>
    </div>
  );
}
