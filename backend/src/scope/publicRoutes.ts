import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { Request } from "express";
import { getDatabase } from "../database.js";
import { canTransition, timestampFor } from "./changeWorkflow.js";
import { publish } from "./events.js";
import { appendAudit, evaluateDriftAlert, fail } from "./scopeService.js";

function param(request: Request, name: string): string {
  const value = (request.params as Record<string, string | string[] | undefined>)[name];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Client approval through a share link. Needs no login, but the link must be active,
 * unexpired and carry the approveChanges permission. Mounted at /api/public/shares.
 */
export function createPublicScopeRouter(): Router {
  const router = Router();

  router.post("/:token/changes/:changeId/decision", async (request, response) => {
    const db = await getDatabase();
    const share = await db.collection("projectShares").findOne({ accessToken: param(request, "token") });
    if (!share) throw fail(404, "not_found", "Shared project not found.");
    if (share.status === "revoked") throw fail(410, "share_revoked", "This project share has been revoked.");
    if (share.status !== "active") throw fail(403, "share_inactive", "This project share is not active.");
    if (typeof share.expiresAt === "string" && Date.parse(share.expiresAt) <= Date.now()) {
      throw fail(410, "share_revoked", "This project share has expired.");
    }
    const permissions = (share.permissions ?? {}) as Record<string, unknown>;
    if (permissions.approveChanges !== true) {
      throw fail(403, "forbidden", "This shared link does not allow approving changes.");
    }

    const body = request.body as Record<string, unknown> | undefined;
    const decision = body?.decision;
    if (decision !== "approved" && decision !== "rejected") {
      throw fail(400, "invalid_decision", "Choose approve or reject.");
    }
    const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 1000) : "";
    if (decision === "rejected" && !comment) {
      throw fail(400, "comment_required", "Add a short reason when rejecting a change.");
    }
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";

    const change = await db.collection("scopeChanges").findOne({
      id: param(request, "changeId"),
      projectId: share.projectId,
      workspaceId: share.workspaceId,
    });
    if (!change) throw fail(404, "not_found", "Change request not found.");
    if (!canTransition(change.status, decision) || change.status === decision) {
      throw fail(409, "already_decided", "This change can no longer be approved or rejected from the shared link.");
    }

    const now = new Date().toISOString();
    const stamp = timestampFor(decision);
    await db.collection("scopeChanges").updateOne({ id: change.id, projectId: share.projectId }, {
      $set: {
        status: decision,
        updatedAt: now,
        ...(stamp ? { [stamp]: now } : {}),
        ...(decision === "rejected" ? { rejectionReason: comment } : comment ? { reviewNotes: comment } : {}),
        clientDecision: { decision, comment, name, at: now, shareId: String(share.id) },
      },
    });
    await appendAudit(db, {
      projectId: String(share.projectId),
      actorId: `share:${String(share.id)}`,
      actorEmail: typeof share.email === "string" ? share.email : undefined,
      action: `change.client_${decision}`,
      entityType: "scope_change",
      entityId: String(change.id),
      summary: `Client ${decision} change #${String(change.changeNumber ?? "")} "${String(change.title ?? "")}"${name ? ` (${name})` : ""}`,
      detail: { from: change.status, to: decision, ...(comment ? { comment } : {}), decisionId: randomUUID() },
    });
    publish({ type: "decision", projectId: String(share.projectId), at: now, entityId: String(change.id), action: decision });

    const project = await db.collection("projects").findOne({ id: share.projectId });
    if (project) await evaluateDriftAlert(db, project);
    if (typeof share.ownerId === "string" && typeof share.workspaceId === "string") {
      await db.collection("notifications").insertOne({
        id: randomUUID(),
        workspaceId: share.workspaceId,
        userId: share.ownerId,
        projectId: String(share.projectId),
        type: "scope_change",
        priority: decision === "rejected" ? "high" : "normal",
        title: `Client ${decision} a change request`,
        message: `"${String(change.title ?? "A change")}" was ${decision}${comment ? `: ${comment}` : "."}`,
        entityType: "scope_change",
        entityId: String(change.id),
        actionUrl: `/projects/${String(share.projectId)}/changes/${String(change.id)}`,
        read: false,
        createdAt: now,
      });
    }
    response.json({ id: change.id, status: decision, decidedAt: now });
  });

  return router;
}
