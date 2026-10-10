import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <WorkspacePageShell>{children}</WorkspacePageShell>;
}
