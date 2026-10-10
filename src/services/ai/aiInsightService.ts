import { getScopeChanges } from "@/services/changes/changeStore";
import { getWorkspaceRequirements } from "@/services/requirements/requirementStore";
import { getWorkspaceMembers } from "@/services/people/memberStore";
import { getWorkspacePayments } from "@/services/payments/paymentStore";
import { getProjects } from "@/services/projects/projectStore";
import { getWorkspaceTasks } from "@/services/tasks/taskStore";
import type { AIAnalysisResult, AIInsight, AIProjectInput } from "@/types";

export async function getAIProjectInputs(ownerId: string, workspaceId: string | null = null): Promise<AIProjectInput[]> {
  if (!workspaceId) return [];
  const projects = await getProjects(ownerId, workspaceId);
  const [tasks, payments, members, changes, requirements] = await Promise.all([
    getWorkspaceTasks(ownerId, workspaceId),
    getWorkspacePayments(ownerId, workspaceId, projects),
    getWorkspaceMembers(ownerId, workspaceId),
    Promise.all(projects.map((project) => getScopeChanges(ownerId, project))),
    getWorkspaceRequirements(ownerId, workspaceId),
  ]);
  return projects.map((project, index) => ({
    project,
    requirements: requirements.filter((requirement) => requirement.projectId === project.id),
    tasks: tasks.filter((task) => task.projectId === project.id),
    scopeChanges: changes[index],
    payments: payments.filter((payment) => payment.projectId === project.id),
    members: members.filter((member) => member.projectIds.includes(project.id)),
  }));
}

export async function getAIInsights(): Promise<AIInsight[]> {
  return [];
}

export async function generateAIInsights(input: AIProjectInput): Promise<AIAnalysisResult> {
  return {
    insights: [],
    summary: input.project
      ? `No AI provider is connected for ${input.project.name}.`
      : "No AI provider is connected.",
  };
}
