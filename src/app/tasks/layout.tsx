import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";

export default function MyTasksLayout({ children }: { children: React.ReactNode }) {
  return <WorkspacePageShell>{children}</WorkspacePageShell>;
}
