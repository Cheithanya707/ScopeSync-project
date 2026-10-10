import { createHash } from "node:crypto";

type Row = Record<string, unknown>;

export const EXCLUDED_REQUIREMENT_STATUSES = new Set(["archived", "rejected"]);
const TRACKED_FIELDS = ["title", "description", "acceptanceCriteria", "priority", "type"] as const;
export type TrackedField = (typeof TRACKED_FIELDS)[number];

export type SnapshotItem = {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  description: string;
  acceptanceCriteria: string;
};

export type DriftItem = { id: string; code: string; title: string };
export type DriftReport = {
  baselineCount: number;
  currentCount: number;
  added: DriftItem[];
  removed: DriftItem[];
  modified: (DriftItem & { fields: TrackedField[] })[];
  approvedChanges: number;
  pendingChanges: number;
  extraHours: number;
  extraCost: number;
  driftPercent: number;
  level: "none" | "low" | "medium" | "high";
};

const text = (value: unknown): string => (typeof value === "string" ? value : "");

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Active scope = every requirement that is not archived or rejected. */
export function buildSnapshot(requirements: Row[]): SnapshotItem[] {
  return requirements
    .filter((item) => !EXCLUDED_REQUIREMENT_STATUSES.has(text(item.status)))
    .map((item) => ({
      id: text(item.id),
      code: text(item.code),
      title: text(item.title),
      status: text(item.status),
      priority: text(item.priority),
      type: text(item.type),
      description: text(item.description),
      acceptanceCriteria: text(item.acceptanceCriteria),
    }))
    .sort((left, right) => left.code.localeCompare(right.code, undefined, { numeric: true }));
}

export function hashSnapshot(items: SnapshotItem[]): string {
  return sha256(canonicalJson(items));
}

const reference = (item: SnapshotItem): DriftItem => ({ id: item.id, code: item.code, title: item.title });

function levelFor(percent: number): DriftReport["level"] {
  if (percent <= 0) return "none";
  if (percent < 15) return "low";
  if (percent < 35) return "medium";
  return "high";
}

const positive = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/**
 * Rule-based drift: (added + removed + modified) / baseline size, capped at 100.
 * Change requests created after the baseline add their approved hours and cost.
 */
export function computeDrift(
  baseline: SnapshotItem[],
  current: SnapshotItem[],
  changes: Row[],
  baselineCreatedAt: string,
): DriftReport {
  const before = new Map(baseline.map((item) => [item.id, item]));
  const after = new Map(current.map((item) => [item.id, item]));
  const added = current.filter((item) => !before.has(item.id)).map(reference);
  const removed = baseline.filter((item) => !after.has(item.id)).map(reference);
  const modified: DriftReport["modified"] = [];
  for (const item of current) {
    const original = before.get(item.id);
    if (!original) continue;
    const fields = TRACKED_FIELDS.filter((field) => original[field] !== item[field]);
    if (fields.length) modified.push({ ...reference(item), fields });
  }

  let approvedChanges = 0;
  let pendingChanges = 0;
  let extraHours = 0;
  let extraCost = 0;
  for (const change of changes) {
    if (text(change.createdAt) <= baselineCreatedAt) continue;
    const status = text(change.status);
    if (status === "approved" || status === "implemented") {
      approvedChanges += 1;
      const impact = (change.impact && typeof change.impact === "object" ? change.impact : {}) as Row;
      extraHours += positive(impact.extraHours);
      extraCost += positive(impact.extraCost);
    } else if (status === "new" || status === "under_review") {
      pendingChanges += 1;
    }
  }

  const touched = added.length + removed.length + modified.length;
  const driftPercent = Math.min(100, Math.round((touched / Math.max(baseline.length, 1)) * 100));
  return {
    baselineCount: baseline.length,
    currentCount: current.length,
    added,
    removed,
    modified,
    approvedChanges,
    pendingChanges,
    extraHours: Math.round(extraHours * 100) / 100,
    extraCost: Math.round(extraCost * 100) / 100,
    driftPercent,
    level: levelFor(driftPercent),
  };
}
