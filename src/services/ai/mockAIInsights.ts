import type { AIInsight } from "@/types";

export const mockAIInsights: AIInsight[] = [
  {
    id: "example-deadline-risk",
    workspaceId: "example-workspace",
    projectId: "example-project",
    type: "deadline",
    severity: "high",
    title: "Example only: several tasks are close to their deadlines",
    description: "Illustrative fixture for UI development; this is not based on project data or an AI analysis.",
    recommendation: "Replace this fixture with provider output only after an AI provider is explicitly connected.",
  },
  {
    id: "example-requirement-gap",
    workspaceId: "example-workspace",
    projectId: "example-project",
    type: "requirement",
    severity: "medium",
    title: "Example only: a requirement has no linked task",
    description: "Illustrative fixture for UI development; requirement tracking is not connected in this frontend.",
  },
];
