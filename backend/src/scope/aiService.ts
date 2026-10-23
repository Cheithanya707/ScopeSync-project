import { randomUUID } from "node:crypto";
import type { Db, Document } from "mongodb";
import type { FirebaseIdentity } from "../firebaseAuth.js";
import {
  ANALYSIS_TASK,
  IMPACT_TASK,
  generateJson,
  parseAnalysis,
  parseImpactSuggestion,
  type ImpactSuggestion,
  type ProjectAnalysis,
} from "./aiClient.js";
import { sha256, canonicalJson } from "./drift.js";
import { appendAudit, computeProjectDrift, fail, loadChange } from "./scopeService.js";

const clip = (value: unknown, max = 140): string => (typeof value === "string" ? value.slice(0, max) : "");

/** Compact, privacy-conscious view of a project: titles and statuses only, no emails, files or notes. */
export async function buildProjectDigest(db: Db, project: Document): Promise<Record<string, unknown>> {
  const projectId = String(project.id);
  const [requirements, tasks, changes, payments, drift] = await Promise.all([
    db.collection("requirements").find({ projectId }).limit(60).toArray(),
    db.collection("tasks").find({ projectId }).limit(80).toArray(),
    db.collection("scopeChanges").find({ projectId }).limit(60).toArray(),
    db.collection("payments").find({ projectId }).limit(40).toArray(),
    computeProjectDrift(db, projectId),
  ]);
  return {
    today: new Date().toISOString().slice(0, 10),
    project: {
      name: clip(project.name, 100),
      type: clip(project.type, 40),
      status: clip(project.status, 20),
      deadline: clip(project.deadline, 10),
      budget: typeof project.budget === "number" ? project.budget : undefined,
      currency: clip(project.currency, 3),
    },
    requirements: requirements.map((item) => ({
      code: clip(item.code, 20), title: clip(item.title), status: clip(item.status, 20), priority: clip(item.priority, 20),
      hasAcceptanceCriteria: typeof item.acceptanceCriteria === "string" && item.acceptanceCriteria.trim().length > 0,
      linkedTasks: tasks.filter((task) => task.requirementId === item.id).length,
    })),
    tasks: tasks.map((item) => ({
      title: clip(item.title), status: clip(item.status, 20), priority: clip(item.priority, 20),
      dueDate: clip(item.dueDate, 10), assigned: Boolean(item.assigneeId), estimatedHours: item.estimatedHours,
    })),
    changes: changes.map((item) => ({
      number: item.changeNumber, title: clip(item.title), status: clip(item.status, 20), priority: clip(item.priority, 20),
      source: clip(item.source, 20), createdAt: clip(item.createdAt, 10), impact: item.impact
        ? { extraHours: (item.impact as Document).extraHours, extraCost: (item.impact as Document).extraCost, scheduleDays: (item.impact as Document).scheduleDays }
        : null,
    })),
    payments: payments.map((item) => ({
      title: clip(item.title), status: clip(item.status, 20), amount: item.amount, currency: clip(item.currency, 3), dueDate: clip(item.dueDate, 10),
    })),
    scopeDrift: drift
      ? { baseline: `v${drift.baseline.version}`, percent: drift.drift.driftPercent, level: drift.drift.level, added: drift.drift.added.length, removed: drift.drift.removed.length, modified: drift.drift.modified.length, extraHours: drift.drift.extraHours, extraCost: drift.drift.extraCost }
      : null,
  };
}

export type StoredAnalysis = { id: string; createdAt: string; model: string; analysis: ProjectAnalysis };

export async function latestAnalysis(db: Db, projectId: string): Promise<StoredAnalysis | null> {
  const row = await db.collection("aiAnalyses").find({ projectId }).sort({ createdAt: -1 }).limit(1).next();
  return row ? { id: String(row.id), createdAt: String(row.createdAt), model: String(row.model), analysis: row.analysis as ProjectAnalysis } : null;
}

export async function runProjectAnalysis(db: Db, identity: FirebaseIdentity, project: Document): Promise<StoredAnalysis> {
  const digest = await buildProjectDigest(db, project);
  const analysis = parseAnalysis(await generateJson(ANALYSIS_TASK, digest));
  const record = {
    id: randomUUID(),
    projectId: String(project.id),
    workspaceId: String(project.workspaceId),
    createdAt: new Date().toISOString(),
    createdBy: identity.uid,
    model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    digestHash: sha256(canonicalJson(digest)),
    analysis,
  };
  await db.collection("aiAnalyses").insertOne({ ...record });
  await appendAudit(db, {
    projectId: record.projectId,
    actorId: identity.uid,
    actorEmail: identity.email,
    action: "ai.analysis_generated",
    entityType: "project",
    entityId: record.projectId,
    summary: `AI project analysis generated (health ${analysis.healthScore}/100, ${analysis.risks.length} risks)`,
    detail: { model: record.model, healthScore: analysis.healthScore },
  });
  return { id: record.id, createdAt: record.createdAt, model: record.model, analysis };
}

export async function suggestChangeImpact(db: Db, project: Document, changeId: string): Promise<ImpactSuggestion> {
  const change = await loadChange(db, String(project.id), changeId);
  if (typeof change.title !== "string") throw fail(400, "invalid_change", "This change has no title to analyse.");
  const digest = await buildProjectDigest(db, project);
  const requirementIds = Array.isArray(change.affectedRequirementIds) ? change.affectedRequirementIds as string[] : [];
  const taskIds = Array.isArray(change.affectedTaskIds) ? change.affectedTaskIds as string[] : [];
  const [requirements, tasks] = await Promise.all([
    requirementIds.length ? db.collection("requirements").find({ projectId: String(project.id), id: { $in: requirementIds } }).toArray() : [],
    taskIds.length ? db.collection("tasks").find({ projectId: String(project.id), id: { $in: taskIds } }).toArray() : [],
  ]);
  return parseImpactSuggestion(await generateJson(IMPACT_TASK, {
    ...digest,
    CHANGE_REQUEST: {
      title: clip(change.title, 120), description: clip(change.description, 1500), type: clip(change.type, 40), priority: clip(change.priority, 20),
      affectedRequirements: requirements.map((item) => `${clip(item.code, 20)} ${clip(item.title)}`),
      affectedTasks: tasks.map((item) => ({ title: clip(item.title), estimatedHours: item.estimatedHours })),
    },
  }));
}
