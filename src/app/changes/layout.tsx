import type { ReactNode } from "react";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";

export default function ChangesLayout({ children }: { children: ReactNode }) {
  return <WorkspacePageShell>{children}</WorkspacePageShell>;
}
