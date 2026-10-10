import type { ReactNode } from "react";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";

export default function HelpLayout({ children }: { children: ReactNode }) {
  return <WorkspacePageShell>{children}</WorkspacePageShell>;
}
