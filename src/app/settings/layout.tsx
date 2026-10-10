import type { ReactNode } from "react";
import ProjectsLayout from "@/src/app/projects/layout";
import { SettingsLayout } from "@/components/settings/SettingsLayout";

export default function SettingsRouteLayout({ children }: { children: ReactNode }) {
  return (
    <ProjectsLayout>
      <SettingsLayout>{children}</SettingsLayout>
    </ProjectsLayout>
  );
}
