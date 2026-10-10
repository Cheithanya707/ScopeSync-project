import type {
  AIProjectInput,
  HealthStatus,
  Payment,
  Requirement,
  ScopeChange,
  Task,
} from "@/types";
import { localDateKey, parseDateOnly } from "@/lib/dates";

export interface RequirementCoverage {
  approved: number;
  covered: number;
  uncovered: Requirement[];
  percentage: number | null;
}

export type DeadlineRiskLevel = "critical" | "high" | "medium" | "low";

export interface TaskDeadlineRisk {
  task: Task;
  level: DeadlineRiskLevel;
  daysUntilDue: number;
}

export function calculateRequirementCoverage(requirements: Requirement[], tasks: Task[]): RequirementCoverage {
  const approved = requirements.filter((item) => item.status === "approved");
  const coveredIds = new Set(tasks.flatMap((task) => task.requirementId ? [task.requirementId] : []));
  const uncovered = approved.filter((requirement) => !coveredIds.has(requirement.id));
  const covered = approved.length - uncovered.length;
  return {
    approved: approved.length,
    covered,
    uncovered,
    percentage: approved.length ? Math.round((covered / approved.length) * 100) : null,
  };
}

export function calculateOpenChanges(changes: ScopeChange[]): ScopeChange[] {
  return changes.filter((change) => change.status === "new" || change.status === "under_review");
}

export function calculateUnassignedTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => !task.assigneeId && task.status !== "completed" && task.status !== "cancelled");
}

export function calculateRequirementGaps(requirements: Requirement[], tasks: Task[]): Requirement[] {
  return calculateRequirementCoverage(requirements, tasks).uncovered;
}

export function calculateDeadlineRisk(tasks: Task[], today = localDateKey()): TaskDeadlineRisk[] {
  return tasks.flatMap((task) => {
    if (!task.dueDate || task.status === "completed" || task.status === "cancelled") return [];
    const dueDate = parseDateOnly(task.dueDate);
    const todayDate = parseDateOnly(today);
    if (!dueDate || !todayDate) return [];
    const dueUtc = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const todayUtc = Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    const daysUntilDue = Math.round((dueUtc - todayUtc) / 86_400_000);
    const level: DeadlineRiskLevel = daysUntilDue < 0 ? "critical" : daysUntilDue <= 2 ? "high" : daysUntilDue <= 7 ? "medium" : "low";
    return [{ task, level, daysUntilDue }];
  }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export function calculateScopeHealth(input: AIProjectInput): HealthStatus {
  const openChanges = calculateOpenChanges(input.scopeChanges).length;
  const unassigned = calculateUnassignedTasks(input.tasks).length;
  const overdue = calculateDeadlineRisk(input.tasks).filter((item) => item.level === "critical").length;
  const gaps = calculateRequirementGaps(input.requirements, input.tasks).length;
  if (!input.tasks.length && !input.scopeChanges.length) return "needs_attention";
  if (overdue >= 3 || openChanges >= 6) return "critical";
  if (overdue > 0 || gaps >= 4 || openChanges >= 4) return "at_risk";
  if (unassigned > 0 || gaps > 0 || openChanges > 0) return "needs_attention";
  return "healthy";
}

export function getScopeHealth(input: AIProjectInput): HealthStatus {
  return calculateScopeHealth(input);
}

export function getRequirementHealth(requirements: Requirement[], tasks: Task[], dataAvailable = true): HealthStatus | null {
  if (!dataAvailable) return null;
  const coverage = calculateRequirementCoverage(requirements, tasks);
  if (!coverage.approved) return "needs_attention";
  if (coverage.percentage === 100) return "healthy";
  if (coverage.percentage !== null && coverage.percentage < 50) return "at_risk";
  return "needs_attention";
}

export function getTaskHealth(tasks: Task[]): HealthStatus {
  if (!tasks.length) return "needs_attention";
  const unassigned = calculateUnassignedTasks(tasks).length;
  if (unassigned >= 5) return "at_risk";
  return unassigned ? "needs_attention" : "healthy";
}

export function getDeadlineHealth(tasks: Task[]): HealthStatus {
  const risk = calculateDeadlineRisk(tasks);
  const overdue = risk.filter((item) => item.level === "critical").length;
  if (overdue >= 3) return "critical";
  if (overdue) return "at_risk";
  if (risk.some((item) => item.level === "high")) return "needs_attention";
  return "healthy";
}

export function getChangeHealth(changes: ScopeChange[]): HealthStatus {
  const open = calculateOpenChanges(changes).length;
  if (open >= 6) return "critical";
  if (open >= 4) return "at_risk";
  return open ? "needs_attention" : "healthy";
}

export function getPaymentHealth(payments: Payment[]): HealthStatus {
  const today = localDateKey();
  const overdue = payments.filter((payment) =>
    payment.status === "pending" &&
    payment.dueDate &&
    parseDateOnly(payment.dueDate) &&
    payment.dueDate < today,
  ).length;
  if (overdue >= 3) return "critical";
  if (overdue) return "at_risk";
  return "healthy";
}

export function getTeamHealth(input: AIProjectInput): HealthStatus {
  const assignedIds = new Set(input.tasks.flatMap((task) => task.assigneeId ? [task.assigneeId] : []));
  const activeMembers = input.members.filter((member) => member.status === "active");
  if (!input.tasks.length || !activeMembers.length) return "needs_attention";
  return activeMembers.some((member) => assignedIds.has(member.id) || (member.userId && assignedIds.has(member.userId)))
    ? "healthy"
    : "needs_attention";
}

export function getScopeGrowthSignal(changes: ScopeChange[]): number {
  return changes.filter((change) =>
    change.status === "approved" &&
    ["new_requirement", "new_feature", "enhancement"].includes(change.type),
  ).length;
}

export function getHealthLabel(status: HealthStatus | null): string {
  if (status === null) return "Not available";
  return {
    healthy: "Healthy",
    needs_attention: "Needs attention",
    at_risk: "At risk",
    critical: "Critical",
  }[status];
}
