import type { Request, Response } from "express";
import { Router } from "express";
import { getDatabase } from "../database.js";
import type { FirebaseIdentity } from "../firebaseAuth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { aiConfigured } from "./aiClient.js";
import { latestAnalysis, runProjectAnalysis, suggestChangeImpact } from "./aiService.js";
import { verifyChain } from "./auditChain.js";
import { allowedTransitions, canTransition, isChangeStatus, parseImpact, timestampFor } from "./changeWorkflow.js";
import { toCsv } from "./csv.js";
import { subscribe } from "./events.js";
import {
  appendAudit,
  computeProjectDrift,
  createBaseline,
  evaluateDriftAlert,
  fail,
  listBaselines,
  loadAudit,
  loadChange,
  requireProjectAccess,
} from "./scopeService.js";

function identityOf(response: Response): FirebaseIdentity {
  const identity = response.locals.identity as FirebaseIdentity | undefined;
  if (!identity) throw fail(401, "unauthorized", "Sign in to continue.");
  return identity;
}

function param(request: Request, name: string): string {
  const value = (request.params as Record<string, string | string[] | undefined>)[name];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function bodyOf(request: Request): Record<string, unknown> {
  if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
    throw fail(400, "invalid_body", "Provide a JSON object for this request.");
  }
  return request.body as Record<string, unknown>;
}

/** Authenticated scope tools. Mounted at /api/scope behind requireFirebaseUser. */
export function createScopeRouter(): Router {
  const router = Router();
  const aiLimit = rateLimit({ name: "ai", windowMs: 60_000, max: 8 });

  router.get("/projects/:projectId/ai/analysis", async (request, response) => {
    const db = await getDatabase();
    const projectId = param(request, "projectId");
    await requireProjectAccess(db, identityOf(response), projectId);
    response.json({ configured: aiConfigured(), latest: await latestAnalysis(db, projectId) });
  });

  router.post("/projects/:projectId/ai/analysis", aiLimit, async (request, response) => {
    const db = await getDatabase();
    const identity = identityOf(response);
    const project = await requireProjectAccess(db, identity, param(request, "projectId"));
    response.status(201).json(await runProjectAnalysis(db, identity, project));
  });

  router.post("/projects/:projectId/changes/:changeId/ai/impact", aiLimit, async (request, response) => {
    const db = await getDatabase();
    const project = await requireProjectAccess(db, identityOf(response), param(request, "projectId"));
    response.json(await suggestChangeImpact(db, project, param(request, "changeId")));
  });

  router.get("/projects/:projectId/baselines", async (request, response) => {
    const db = await getDatabase();
    await requireProjectAccess(db, identityOf(response), param(request, "projectId"));
    response.json(await listBaselines(db, param(request, "projectId")));
  });

  router.post("/projects/:projectId/baselines", async (request, response) => {
    const db = await getDatabase();
    const identity = identityOf(response);
    const project = await requireProjectAccess(db, identity, param(request, "projectId"));
    const baseline = await createBaseline(db, identity, project, bodyOf(request));
    response.status(201).json(baseline);
  });

  router.get("/projects/:projectId/drift", async (request, response) => {
    const db = await getDatabase();
    const projectId = param(request, "projectId");
    await requireProjectAccess(db, identityOf(response), projectId);
    const baselineId = typeof request.query.baselineId === "string" ? request.query.baselineId : undefined;
    response.json(await computeProjectDrift(db, projectId, baselineId));
  });

  router.get("/projects/:projectId/audit", async (request, response) => {
    const db = await getDatabase();
    const projectId = param(request, "projectId");
    await requireProjectAccess(db, identityOf(response), projectId);
    const entries = await loadAudit(db, projectId);
    const verification = verifyChain(entries);
    response.json({
      verification,
      total: entries.length,
      entries: entries.slice(-200).reverse().map((entry) => ({
        seq: entry.seq,
        at: entry.at,
        actorEmail: entry.actorEmail ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
        hash: entry.hash,
      })),
    });
  });

  router.post("/projects/:projectId/changes/:changeId/transition", async (request, response) => {
    const db = await getDatabase();
    const identity = identityOf(response);
    const projectId = param(request, "projectId");
    const project = await requireProjectAccess(db, identity, projectId);
    const change = await loadChange(db, projectId, param(request, "changeId"));
    const body = bodyOf(request);
    if (!isChangeStatus(body.status)) throw fail(400, "invalid_status", "Choose a valid change status.");
    if (body.status === change.status) {
      response.json({ id: change.id, status: change.status });
      return;
    }
    if (!canTransition(change.status, body.status)) {
      throw fail(409, "invalid_transition", `A change that is ${String(change.status).replaceAll("_", " ")} cannot move to ${body.status.replaceAll("_", " ")}. Allowed: ${allowedTransitions(change.status).join(", ") || "none"}.`);
    }
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";
    const now = new Date().toISOString();
    const stamp = timestampFor(body.status);
    await db.collection("scopeChanges").updateOne({ id: change.id, projectId }, {
      $set: {
        status: body.status,
        updatedAt: now,
        ...(stamp ? { [stamp]: now } : {}),
        ...(body.status === "rejected" && note ? { rejectionReason: note } : {}),
        ...(body.status !== "rejected" && note ? { reviewNotes: note } : {}),
      },
    });
    await appendAudit(db, {
      projectId,
      actorId: identity.uid,
      actorEmail: identity.email,
      action: `change.${body.status}`,
      entityType: "scope_change",
      entityId: String(change.id),
      summary: `Change #${String(change.changeNumber ?? "")} "${String(change.title ?? "")}" moved from ${String(change.status)} to ${body.status}`,
      detail: { from: change.status, to: body.status, ...(note ? { note } : {}) },
    });
    await evaluateDriftAlert(db, project);
    response.json({ id: change.id, status: body.status, updatedAt: now });
  });

  router.put("/projects/:projectId/changes/:changeId/impact", async (request, response) => {
    const db = await getDatabase();
    const identity = identityOf(response);
    const projectId = param(request, "projectId");
    const project = await requireProjectAccess(db, identity, projectId);
    const change = await loadChange(db, projectId, param(request, "changeId"));
    const impact = { ...parseImpact(bodyOf(request)), updatedAt: new Date().toISOString(), updatedBy: identity.email };
    await db.collection("scopeChanges").updateOne({ id: change.id, projectId }, { $set: { impact, updatedAt: impact.updatedAt } });
    await appendAudit(db, {
      projectId,
      actorId: identity.uid,
      actorEmail: identity.email,
      action: "change.impact_updated",
      entityType: "scope_change",
      entityId: String(change.id),
      summary: `Impact recorded for change #${String(change.changeNumber ?? "")}: ${impact.extraHours}h, ${impact.extraCost} cost, ${impact.scheduleDays} days`,
      detail: { extraHours: impact.extraHours, extraCost: impact.extraCost, scheduleDays: impact.scheduleDays },
    });
    await evaluateDriftAlert(db, project);
    response.json(impact);
  });

  router.get("/projects/:projectId/export.csv", async (request, response) => {
    const db = await getDatabase();
    const projectId = param(request, "projectId");
    const project = await requireProjectAccess(db, identityOf(response), projectId);
    const [baselines, requirements, changes, drift] = await Promise.all([
      listBaselines(db, projectId),
      db.collection("requirements").find({ projectId }).sort({ code: 1 }).toArray(),
      db.collection("scopeChanges").find({ projectId }).sort({ changeNumber: 1 }).toArray(),
      computeProjectDrift(db, projectId),
    ]);
    const rows: unknown[][] = [
      ["ScopeSync scope history", String(project.name ?? ""), new Date().toISOString()],
      [],
      ["Type", "Ref", "Title", "Status", "Priority", "Date", "Extra hours", "Extra cost", "Schedule days", "Note"],
      ...baselines.map((item) => ["Baseline", `v${item.version}`, item.name, `${item.itemCount} requirements`, "", item.createdAt, "", "", "", item.note]),
      ...requirements.map((item) => ["Requirement", item.code, item.title, item.status, item.priority, item.createdAt, "", "", "", ""]),
      ...changes.map((item) => {
        const impact = (item.impact ?? {}) as Record<string, unknown>;
        return ["Change", `CHG-${String(item.changeNumber ?? "")}`, item.title, item.status, item.priority, item.createdAt, impact.extraHours ?? "", impact.extraCost ?? "", impact.scheduleDays ?? "", item.reviewNotes ?? item.rejectionReason ?? ""];
      }),
    ];
    if (drift) {
      rows.push([], ["Drift vs baseline", `v${drift.baseline.version}`, `${drift.drift.driftPercent}%`, drift.drift.level, "", "", drift.drift.extraHours, drift.drift.extraCost, "", `${drift.drift.added.length} added, ${drift.drift.removed.length} removed, ${drift.drift.modified.length} modified`]);
    }
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="scopesync-${projectId.replace(/[^\w-]/g, "")}.csv"`);
    response.send(toCsv(rows));
  });

  router.get("/projects/:projectId/events", async (request, response) => {
    const db = await getDatabase();
    const projectId = param(request, "projectId");
    await requireProjectAccess(db, identityOf(response), projectId);
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    response.write("retry: 5000\n\n");
    response.write(`event: ready\ndata: ${JSON.stringify({ projectId })}\n\n`);
    const unsubscribe = subscribe(projectId, (event) => {
      response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    });
    const heartbeat = setInterval(() => response.write(": ping\n\n"), 25_000);
    heartbeat.unref();
    request.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  return router;
}
