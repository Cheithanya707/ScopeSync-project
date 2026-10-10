import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import type { ProjectSharePermissions } from "@/types";
import type { ClientViewSection } from "@/components/client-view/clientViewTypes";
import { ClientHeader } from "@/components/client-view/ClientHeader";
import { ClientNavigation } from "@/components/client-view/ClientNavigation";

export function ClientLayout({
  projectName,
  permissions,
  active,
  onSelect,
  children,
}: {
  projectName: string;
  permissions: ProjectSharePermissions;
  active: ClientViewSection;
  onSelect: (section: ClientViewSection) => void;
  children: ReactNode;
}) {
  return <main className="min-h-screen bg-slate-50">
    <ClientHeader projectName={projectName} />
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ClientNavigation permissions={permissions} active={active} onSelect={onSelect} />
      {children}
      <footer className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck aria-hidden="true" className="size-4" />Shared project information — read-only unless change requests are enabled.</footer>
    </div>
  </main>;
}
