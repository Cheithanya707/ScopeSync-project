export const CHANGE_STATUSES = ["new", "under_review", "approved", "rejected", "implemented", "cancelled"] as const;
export type ChangeStatusValue = (typeof CHANGE_STATUSES)[number];

const TRANSITIONS: Record<ChangeStatusValue, ChangeStatusValue[]> = {
  new: ["under_review", "approved", "rejected", "cancelled"],
  under_review: ["new", "approved", "rejected", "cancelled"],
  approved: ["implemented", "cancelled"],
  rejected: ["under_review"],
  implemented: [],
  cancelled: ["new"],
};

export function isChangeStatus(value: unknown): value is ChangeStatusValue {
  return typeof value === "string" && (CHANGE_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: unknown, to: unknown): boolean {
  if (!isChangeStatus(from) || !isChangeStatus(to)) return false;
  return from === to || TRANSITIONS[from].includes(to);
}

export function allowedTransitions(from: unknown): ChangeStatusValue[] {
  return isChangeStatus(from) ? TRANSITIONS[from] : [];
}

/** Timestamp field that records when a change entered the given status. */
export function timestampFor(status: ChangeStatusValue): string | undefined {
  return {
    under_review: "reviewedAt",
    approved: "approvedAt",
    rejected: "rejectedAt",
    implemented: "implementedAt",
  }[status as "under_review" | "approved" | "rejected" | "implemented"];
}

export type Impact = { extraHours: number; extraCost: number; scheduleDays: number; note: string };

function bounded(value: unknown, max: number, label: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
    throw Object.assign(new Error(`${label} must be a number between 0 and ${max}.`), { status: 400, code: "invalid_impact" });
  }
  return Math.round(parsed * 100) / 100;
}

export function parseImpact(body: Record<string, unknown>): Impact {
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length > 1000) {
    throw Object.assign(new Error("The impact note must be 1,000 characters or fewer."), { status: 400, code: "invalid_impact" });
  }
  return {
    extraHours: bounded(body.extraHours ?? 0, 10000, "Extra hours"),
    extraCost: bounded(body.extraCost ?? 0, 1_000_000_000, "Extra cost"),
    scheduleDays: bounded(body.scheduleDays ?? 0, 3650, "Schedule impact (days)"),
    note,
  };
}
