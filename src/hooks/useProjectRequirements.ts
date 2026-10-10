"use client";

import { useEffect, useState } from "react";
import type { Project, Requirement } from "@/types";
import { getRequirements } from "@/services/requirements/requirementStore";

export function useProjectRequirements(project: Project | null, ownerId: string) {
  const [result, setResult] = useState<{ projectId: string; requirements: Requirement[]; error: string } | null>(null);

  useEffect(() => {
    let current = true;
    if (!project) return () => { current = false; };
    void getRequirements(ownerId, project).then((items) => {
      if (current) setResult({ projectId: project.id, requirements: items.filter((item) => item.status !== "archived"), error: "" });
    }).catch(() => {
      if (current) setResult({ projectId: project.id, requirements: [], error: "Unable to load this project's requirements." });
    });
    return () => { current = false; };
  }, [ownerId, project]);

  const currentResult = project?.id === result?.projectId ? result : null;
  return { requirements: currentResult?.requirements ?? [], error: currentResult?.error ?? "" };
}
