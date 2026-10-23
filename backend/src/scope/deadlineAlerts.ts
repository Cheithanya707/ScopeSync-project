import { randomUUID } from "node:crypto";
import type { Db, Document } from "mongodb";

export type DeadlineState = "overdue" | "due_soon";

/** Dates are YYYY-MM-DD. Due within two days (or today) is "due_soon"; earlier than today is "overdue". */
export function classifyDeadline(dueDate: unknown, now: Date = new Date()): DeadlineState | null {
  if (typeof dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(dueDate)) return null;
  const due = Date.parse(dueDate.slice(0, 10));
  const today = Date.parse(now.toISOString().slice(0, 10));
  if (!Number.isFinite(due)) return null;
  const days = Math.round((due - today) / 86_400_000);
  if (days < 0) return "overdue";
  return days <= 2 ? "due_soon" : null;
}

async function notify(db: Db, userId: string, dedupeKey: string, doc: Document): Promise<boolean> {
  const result = await db.collection("notifications").updateOne(
    { userId, dedupeKey },
    { $setOnInsert: { id: randomUUID(), read: false, createdAt: new Date().toISOString(), ...doc } },
    { upsert: true },
  );
  return result.upsertedCount > 0;
}

/** Creates one notification per task/payment and deadline state. Safe to run repeatedly. */
export async function runDeadlineSweep(db: Db, now: Date = new Date()): Promise<number> {
  let created = 0;
  const tasks = await db.collection("tasks").find({
    status: { $nin: ["completed", "cancelled"] },
    dueDate: { $type: "string" },
  }).limit(2000).toArray();

  for (const task of tasks) {
    const state = classifyDeadline(task.dueDate, now);
    if (!state || typeof task.workspaceId !== "string" || typeof task.projectId !== "string") continue;
    let userId = typeof task.ownerId === "string" ? task.ownerId : "";
    if (typeof task.assigneeId === "string") {
      const member = await db.collection("workspaceMembers").findOne({ id: task.assigneeId, status: "active" });
      if (member && typeof member.userId === "string") userId = member.userId;
    }
    if (!userId) continue;
    if (await notify(db, userId, `task:${String(task.id)}:${state}:${String(task.dueDate)}`, {
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      type: state === "overdue" ? "task_overdue" : "task_due",
      priority: state === "overdue" ? "high" : "normal",
      title: state === "overdue" ? "Task is overdue" : "Task is due soon",
      message: `"${String(task.title ?? "A task")}" is ${state === "overdue" ? "past its due date" : "due within two days"} (${String(task.dueDate)}).`,
      entityType: "task",
      entityId: String(task.id),
      actionUrl: `/projects/${task.projectId}/tasks/${String(task.id)}`,
    })) created += 1;
  }

  const payments = await db.collection("payments").find({ status: "pending", dueDate: { $type: "string" } }).limit(2000).toArray();
  for (const payment of payments) {
    const state = classifyDeadline(payment.dueDate, now);
    if (!state || typeof payment.ownerId !== "string" || typeof payment.workspaceId !== "string" || typeof payment.projectId !== "string") continue;
    if (await notify(db, payment.ownerId, `payment:${String(payment.id)}:${state}:${String(payment.dueDate)}`, {
      workspaceId: payment.workspaceId,
      projectId: payment.projectId,
      type: "payment_due",
      priority: state === "overdue" ? "high" : "normal",
      title: state === "overdue" ? "Payment is overdue" : "Payment is due soon",
      message: `"${String(payment.title ?? "A payment")}" is ${state === "overdue" ? "past its due date" : "due within two days"} (${String(payment.dueDate)}).`,
      entityType: "payment",
      entityId: String(payment.id),
      actionUrl: `/projects/${payment.projectId}/payments/${String(payment.id)}`,
    })) created += 1;
  }
  return created;
}

/** Runs shortly after boot and then hourly. Failures are logged and never crash the API. */
export function startDeadlineSweeper(getDb: () => Promise<Db>): () => void {
  const run = () => {
    void getDb().then((db) => runDeadlineSweep(db)).catch((error: unknown) => {
      console.error("ScopeSync deadline sweep failed:", error);
    });
  };
  const first = setTimeout(run, 20_000);
  const every = setInterval(run, 60 * 60 * 1000);
  first.unref();
  every.unref();
  return () => {
    clearTimeout(first);
    clearInterval(every);
  };
}
