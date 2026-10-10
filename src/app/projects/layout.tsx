import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <WorkspacePageShell>{children}</WorkspacePageShell>;
}
