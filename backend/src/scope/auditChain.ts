import { canonicalJson, sha256 } from "./drift.js";

export const GENESIS_HASH = "0".repeat(64);

export type AuditCore = {
  seq: number;
  projectId: string;
  at: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  detail: Record<string, unknown>;
};

export type StoredAuditEntry = AuditCore & { prevHash: string; hash: string };

export function hashEntry(prevHash: string, core: AuditCore): string {
  return sha256(`${prevHash}|${canonicalJson(core)}`);
}

/** Rebuilds the hashed fields of a stored entry, dropping anything that was never part of the hash. */
export function coreOf(entry: StoredAuditEntry): AuditCore {
  return {
    seq: entry.seq,
    projectId: entry.projectId,
    at: entry.at,
    actorId: entry.actorId,
    ...(entry.actorEmail !== undefined ? { actorEmail: entry.actorEmail } : {}),
    action: entry.action,
    entityType: entry.entityType,
    ...(entry.entityId !== undefined ? { entityId: entry.entityId } : {}),
    summary: entry.summary,
    detail: entry.detail,
  };
}

export type ChainVerification = { valid: boolean; checked: number; brokenAtSeq?: number };

/** Every entry must point at the hash of the one before it, and its own hash must match its content. */
export function verifyChain(entries: StoredAuditEntry[]): ChainVerification {
  const ordered = [...entries].sort((left, right) => left.seq - right.seq);
  let previous = GENESIS_HASH;
  let expectedSeq = 1;
  for (const entry of ordered) {
    if (entry.seq !== expectedSeq || entry.prevHash !== previous || hashEntry(previous, coreOf(entry)) !== entry.hash) {
      return { valid: false, checked: expectedSeq - 1, brokenAtSeq: entry.seq };
    }
    previous = entry.hash;
    expectedSeq += 1;
  }
  return { valid: true, checked: ordered.length };
}
