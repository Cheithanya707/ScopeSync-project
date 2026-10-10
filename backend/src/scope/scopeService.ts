import { randomUUID } from "node:crypto";
import type { Db, Document } from "mongodb";
import type { FirebaseIdentity } from "../firebaseAuth.js";
import { GENESIS_HASH, hashEntry, type AuditCore, type StoredAuditEntry } from "./auditChain.js";
import { buildSnapshot, computeDrift, hashSnapshot, type DriftReport, type SnapshotItem } from "./drift.js";
import { publish } from "./events.js";

export function fail(status: number, code: string, message: string): Error {
  return Object.assign(new Error(message), { status, code });
}

const isDuplicateKey = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;

const publicDoc = (document: Document): Document => {
  const { _id: ignored, ...rest } = document;
  void ignored;
  return rest;
};

/** Same access rule as the rest of the API: workspace owner or an active workspace member. */
export async function requireProjectAccess(db: Db, identity: FirebaseIdentity, projectId: string): Promise<Document> {
  const project = await db.collection("projects").findOne({ id: projectId });
  if (!project || typeof project.workspaceId !== "string") throw fail(404, "not_found", "Project not found.");
  const workspace = await db.collection("workspaces").findOne({ id: project.workspaceId });
  if (!workspace) throw fail(404, "not_found", "Project not found.");
  if (workspace.ownerId !== identity.uid && project.ownerId !== identity.uid) {
    const membership = await db.collection("workspaceMembers").findOne({
      workspaceId: project.workspaceId,
      userId: identity.uid,
      status: "active",
    });
    if (!membership) throw fail(403, "forbidden", "You do not have access to this project.");
  }
  return project;
}

/* ------------------------------------------------------------------ audit trail */

export type AuditInput = {
  projectId: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  detail?: Record<string, unknown>;
};

export async function appendAudit(db: Db, input: AuditInput): Promise<StoredAuditEntry> {
  const collection = db.collection("auditLog");
  const detail = JSON.parse(JSON.stringify(input.detail ?? {})) as Record<string, unknown>;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const last = await collection.find({ projectId: input.projectId }).sort({ seq: -1 }).limit(1).next();
    const seq = (typeof last?.seq === "number" ? last.seq : 0) + 1;
    const prevHash = typeof last?.hash === "string" ? last.hash : GENESIS_HASH;
    const core: AuditCore = {
      seq,
      projectId: input.projectId,
      at: new Date().toISOString(),
      actorId: input.actorId,
      ...(input.actorEmail ? { actorEmail: input.actorEmail } : {}),
      action: input.action,
      entityType: input.entityType,
      ...(input.entityId ? { entityId: input.entityId } : {}),
      summary: input.summary.slice(0, 300),
      detail,
    };
    const entry: StoredAuditEntry = { ...core, prevHash, hash: hashEntry(prevHash, core) };
    try {
      await collection.insertOne({ id: randomUUID(), ...entry });
      publish({
        type: "audit",
        projectId: input.projectId,
        at: core.at,
        action: core.action,
        summary: core.summary,
        ...(core.entityId ? { entityId: core.entityId } : {}),
      });
      return entry;
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
  }
  throw fail(503, "audit_busy", "The audit trail is busy. Please try again.");
}

export async function loadAudit(db: Db, projectId: string): Promise<StoredAuditEntry[]> {
  const rows = await db.collection("auditLog").find({ projectId }).sort({ seq: 1 }).toArray();
  return rows.map((row) => publicDoc(row) as unknown as StoredAuditEntry);
}

/* ------------------------------------------------------------------ baselines + drift */

export type BaselineSummary = {
  id: string;
  version: number;
  name: string;
  note: string;
  itemCount: number;
  contentHash: string;
  createdAt: string;
  createdByEmail?: string;
};

const summarize = (baseline: Document): BaselineSummary => ({
  id: String(baseline.id),
  version: Number(baseline.version),
  name: String(baseline.name ?? ""),
  note: String(baseline.note ?? ""),
  itemCount: Number(baseline.itemCount ?? 0),
  contentHash: String(baseline.contentHash ?? ""),
  createdAt: String(baseline.createdAt),
  ...(typeof baseline.createdByEmail === "string" ? { createdByEmail: baseline.createdByEmail } : {}),
});

export async function listBaselines(db: Db, projectId: string): Promise<BaselineSummary[]> {
  const rows = await db.collection("scopeBaselines")
    .find({ projectId }, { projection: { items: 0 } })
    .sort({ version: -1 })
    .toArray();
  return rows.map(summarize);
}

export async function createBaseline(
  db: Db,
  identity: FirebaseIdentity,
  project: Document,
  input: { name?: unknown; note?: unknown },
): Promise<BaselineSummary> {
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 80) : "";
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 500) : "";
  const requirements = await db.collection("requirements").find({ projectId: project.id }).toArray();
  const items = buildSnapshot(requirements);
  if (!items.length) {
    throw fail(400, "empty_scope", "Add at least one active requirement before locking a scope baseline.");
  }
  const collection = db.collection("scopeBaselines");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const last = await collection.find({ projectId: project.id }).sort({ version: -1 }).limit(1).next();
    const version = (typeof last?.version === "number" ? last.version : 0) + 1;
    const baseline = {
      id: randomUUID(),
      projectId: String(project.id),
      workspaceId: String(project.workspaceId),
      version,
      name: name || `Baseline v${version}`,
      note,
      items,
      itemCount: items.length,
      contentHash: hashSnapshot(items),
      createdBy: identity.uid,
      createdByEmail: identity.email,
      createdAt: new Date().toISOString(),
    };
    try {
      await collection.insertOne({ ...baseline });
      await appendAudit(db, {
        projectId: baseline.projectId,
        actorId: identity.uid,
        actorEmail: identity.email,
        action: "baseline.locked",
        entityType: "baseline",
        entityId: baseline.id,
        summary: `Locked scope baseline v${version} with ${items.length} requirements`,
        detail: { version, itemCount: items.length, contentHash: baseline.contentHash },
      });
      publish({ type: "baseline", projectId: baseline.projectId, at: baseline.createdAt, entityId: baseline.id });
      return summarize(baseline);
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
    }
  }
  throw fail(503, "baseline_busy", "Could not lock the baseline. Please try again.");
}

export type DriftResult = { baseline: BaselineSummary; drift: DriftReport; baselineIntact: boolean };

export async function computeProjectDrift(db: Db, projectId: string, baselineId?: string): Promise<DriftResult | null> {
  const collection = db.collection("scopeBaselines");
  const baseline = baselineId
    ? await collection.findOne({ id: baselineId, projectId })
    : await collection.find({ projectId }).sort({ version: -1 }).limit(1).next();
  if (!baseline) return null;
  const [requirements, changes] = await Promise.all([
    db.collection("requirements").find({ projectId }).toArray(),
    db.collection("scopeChanges").find({ projectId }).toArray(),
  ]);
  const items = baseline.items as SnapshotItem[];
  return {
    baseline: summarize(baseline),
    drift: computeDrift(items, buildSnapshot(requirements), changes, String(baseline.createdAt)),
    baselineIntact: hashSnapshot(items) === baseline.contentHash,
  };
}

/** Tells the project owner once per baseline and level when drift reaches medium or high. */
export async function evaluateDriftAlert(db: Db, project: Document): Promise<void> {
  const result = await computeProjectDrift(db, String(project.id));
  if (!result || (result.drift.level !== "medium" && result.drift.level !== "high")) return;
  if (typeof project.ownerId !== "string" || typeof project.workspaceId !== "string") return;
  const dedupeKey = `drift:${result.baseline.id}:${result.drift.level}`;
  const notifications = db.collection("notifications");
  if (await notifications.findOne({ userId: project.ownerId, dedupeKey })) return;
  const now = new Date().toISOString();
  await notifications.insertOne({
    id: randomUUID(),
    workspaceId: project.workspaceId,
    userId: project.ownerId,
    projectId: String(project.id),
    type: "scope_change",
    priority: result.drift.level === "high" ? "high" : "normal",
    title: `Scope drift is ${result.drift.level} on ${String(project.name ?? "your project")}`,
    message: `${result.drift.driftPercent}% of the baseline v${result.baseline.version} scope has changed ` +
      `(${result.drift.added.length} added, ${result.drift.removed.length} removed, ${result.drift.modified.length} modified).`,
    entityType: "project",
    entityId: String(project.id),
    actionUrl: `/projects/${String(project.id)}/requirements`,
    dedupeKey,
    read: false,
    createdAt: now,
  });
}

/* ------------------------------------------------------------------ change workflow */

export async function loadChange(db: Db, projectId: string, changeId: string): Promise<Document> {
  const change = await db.collection("scopeChanges").findOne({ id: changeId, projectId });
  if (!change) throw fail(404, "not_found", "Change request not found.");
  return change;
}

export const AUDITED_COLLECTIONS: Record<string, string> = {
  tasks: "task",
  requirements: "requirement",
  scopeChanges: "scope_change",
  payments: "payment",
  documents: "document",
};
