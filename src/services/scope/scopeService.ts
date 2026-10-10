import { requestApi } from "@/lib/apiClient";

export type DriftLevel = "none" | "low" | "medium" | "high";

export interface BaselineSummary {
  id: string;
  version: number;
  name: string;
  note: string;
  itemCount: number;
  contentHash: string;
  createdAt: string;
  createdByEmail?: string;
}

export interface DriftItem { id: string; code: string; title: string }

export interface DriftReport {
  baselineCount: number;
  currentCount: number;
  added: DriftItem[];
  removed: DriftItem[];
  modified: (DriftItem & { fields: string[] })[];
  approvedChanges: number;
  pendingChanges: number;
  extraHours: number;
  extraCost: number;
  driftPercent: number;
  level: DriftLevel;
}

export interface DriftResult {
  baseline: BaselineSummary;
  drift: DriftReport;
  baselineIntact: boolean;
}

export interface AuditEntry {
  seq: number;
  at: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  hash: string;
}

export interface AuditTrail {
  verification: { valid: boolean; checked: number; brokenAtSeq?: number };
  total: number;
  entries: AuditEntry[];
}

export interface ChangeImpact {
  extraHours: number;
  extraCost: number;
  scheduleDays: number;
  note: string;
}

const scopePath = (projectId: string, suffix: string) =>
  `/api/scope/projects/${encodeURIComponent(projectId)}${suffix}`;

export const listBaselines = (projectId: string) =>
  requestApi<BaselineSummary[]>(scopePath(projectId, "/baselines"));

export const createBaseline = (projectId: string, values: { name?: string; note?: string }) =>
  requestApi<BaselineSummary>(scopePath(projectId, "/baselines"), { method: "POST", body: JSON.stringify(values) });

export const getDrift = (projectId: string, baselineId?: string) =>
  requestApi<DriftResult | null>(
    scopePath(projectId, `/drift${baselineId ? `?baselineId=${encodeURIComponent(baselineId)}` : ""}`),
  );

export const getAuditTrail = (projectId: string) => requestApi<AuditTrail>(scopePath(projectId, "/audit"));

export const exportScopeCsv = (projectId: string) =>
  requestApi<Blob>(scopePath(projectId, "/export.csv"), {}, { responseType: "blob" });

export const saveChangeImpact = (projectId: string, changeId: string, values: ChangeImpact) =>
  requestApi<ChangeImpact>(scopePath(projectId, `/changes/${encodeURIComponent(changeId)}/impact`), {
    method: "PUT",
    body: JSON.stringify(values),
  });

export const transitionChange = (projectId: string, changeId: string, status: string, note?: string) =>
  requestApi<{ id: string; status: string }>(scopePath(projectId, `/changes/${encodeURIComponent(changeId)}/transition`), {
    method: "POST",
    body: JSON.stringify({ status, note }),
  });

export const decideSharedChange = (
  token: string,
  changeId: string,
  values: { decision: "approved" | "rejected"; comment?: string; name?: string },
) =>
  requestApi<{ id: string; status: string }>(
    `/api/public/shares/${encodeURIComponent(token)}/changes/${encodeURIComponent(changeId)}/decision`,
    { method: "POST", body: JSON.stringify(values) },
    { authenticated: false },
  );

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
