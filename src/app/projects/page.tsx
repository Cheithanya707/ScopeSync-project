import { Suspense } from "react";
import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  return (
    <Suspense fallback={<div role="status" className="p-8 text-sm text-muted-foreground">Loading projects…</div>}>
      <ProjectsPageClient key={q} initialQuery={q} />
    </Suspense>
  );
}
