import type { Request, Response } from "express";
import type { Db, Document } from "mongodb";
import type { FirebaseIdentity } from "../firebaseAuth.js";
import { allowedTransitions, canTransition, isChangeStatus } from "./changeWorkflow.js";
import { AUDITED_COLLECTIONS, appendAudit, evaluateDriftAlert, fail, requireProjectAccess } from "./scopeService.js";

type Resource = { collection: string; id?: string; projectId?: string };

/** Rejects illegal change-status jumps sent through the generic data API (409). */
export async function enforceChangeWorkflow(
  request: Request,
  response: Response,
  db: Db,
  resource: Resource,
): Promise<void> {
  if (request.method !== "PATCH" || resource.collection !== "scopeChanges" || !resource.id || !resource.projectId) return;
  const next = (request.body as Record<string, unknown> | undefined)?.status;
  if (typeof next !== "string") return;
  const identity = response.locals.identity as FirebaseIdentity | undefined;
  if (!identity) return;
  await requireProjectAccess(db, identity, resource.projectId);
  const current = await db.collection("scopeChanges").findOne({ id: resource.id, projectId: resource.projectId });
  if (!current || current.status === next) return;
  if (!isChangeStatus(next) || !canTransition(current.status, next)) {
    throw fail(
      409,
      "invalid_transition",
      `A change that is ${String(current.status).replaceAll("_", " ")} cannot move to ${next.replaceAll("_", " ")}. Allowed: ${allowedTransitions(current.status).join(", ") || "none"}.`,
    );
  }
}

/** Wraps response.json so the created/updated record can be read after the handler finishes. */
export function captureJson(response: Response): { body: () => unknown } {
  let captured: unknown;
  const original = response.json.bind(response);
  response.json = ((value: unknown) => {
    captured = value;
    return original(value);
  }) as typeof response.json;
  return { body: () => captured };
}

/** Writes a tamper-evident audit entry for a successful write. Never throws: the user's request already succeeded. */
export async function recordMutation(
  request: Request,
  response: Response,
  db: Db,
  resource: Resource,
  body: unknown,
): Promise<void> {
  try {
    const entityType = AUDITED_COLLECTIONS[resource.collection];
    if (!entityType || !resource.projectId) return;
    if (!["POST", "PATCH", "DELETE"].includes(request.method) || response.statusCode >= 300) return;
    const identity = response.locals.identity as FirebaseIdentity | undefined;
    if (!identity) return;

    const record = (body && typeof body === "object" ? body : {}) as Document;
    const verb = request.method === "POST" ? "created" : request.method === "PATCH" ? "updated" : "deleted";
    const title = typeof record.title === "string" ? record.title : typeof record.name === "string" ? record.name : "";
    const entityId = resource.id ?? (typeof record.id === "string" ? record.id : undefined);
    const sentFields = request.method === "PATCH" && request.body && typeof request.body === "object"
      ? Object.keys(request.body as object).filter((key) => !["updatedAt", "createdAt"].includes(key)).slice(0, 20)
      : [];
    await appendAudit(db, {
      projectId: resource.projectId,
      actorId: identity.uid,
      actorEmail: identity.email,
      action: `${entityType}.${verb}`,
      entityType,
      ...(entityId ? { entityId } : {}),
      summary: `${entityType.replaceAll("_", " ")} ${verb}${title ? `: ${title}` : ""}`,
      detail: sentFields.length ? { fields: sentFields } : {},
    });
    if (resource.collection === "requirements" || resource.collection === "scopeChanges") {
      const project = await db.collection("projects").findOne({ id: resource.projectId });
      if (project) await evaluateDriftAlert(db, project);
    }
  } catch (error) {
    console.error("ScopeSync audit hook failed:", error);
  }
}
