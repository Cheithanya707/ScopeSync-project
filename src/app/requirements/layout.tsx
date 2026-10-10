import type { ReactNode } from "react";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";

export default function RequirementsLayout({ children }: { children: ReactNode }) {
  return <WorkspacePageShell>{children}</WorkspacePageShell>;
}
