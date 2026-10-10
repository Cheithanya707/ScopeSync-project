import assert from "node:assert/strict";
import test from "node:test";
import { GENESIS_HASH, hashEntry, verifyChain, type AuditCore, type StoredAuditEntry } from "./auditChain.js";
import { allowedTransitions, canTransition, parseImpact } from "./changeWorkflow.js";
import { csvCell, toCsv } from "./csv.js";
import { buildSnapshot, canonicalJson, computeDrift, hashSnapshot } from "./drift.js";

const requirement = (id: string, code: string, extra: Record<string, unknown> = {}) => ({
  id, code, title: `Title ${code}`, status: "approved", priority: "medium", type: "functional",
  description: "", acceptanceCriteria: "", ...extra,
});

test("snapshot keeps only active requirements, ordered by code", () => {
  const items = buildSnapshot([
    requirement("b", "REQ-010"),
    requirement("a", "REQ-002"),
    requirement("c", "REQ-003", { status: "archived" }),
    requirement("d", "REQ-004", { status: "rejected" }),
  ]);
  assert.deepEqual(items.map((item) => item.id), ["a", "b"]);
});

test("canonical JSON ignores key order and undefined values", () => {
  assert.equal(canonicalJson({ b: 1, a: [2, { d: 1, c: undefined }] }), canonicalJson({ a: [2, { d: 1 }], b: 1 }));
  assert.equal(hashSnapshot(buildSnapshot([requirement("a", "REQ-001")])).length, 64);
});

test("drift reports added, removed and modified requirements", () => {
  const baseline = buildSnapshot([requirement("a", "REQ-001"), requirement("b", "REQ-002"), requirement("c", "REQ-003"), requirement("d", "REQ-004")]);
  const current = buildSnapshot([
    requirement("a", "REQ-001"),
    requirement("b", "REQ-002", { title: "Changed" }),
    requirement("e", "REQ-005"),
    requirement("c", "REQ-003", { status: "archived" }),
    requirement("d", "REQ-004"),
  ]);
  const changes = [
    { createdAt: "2026-02-01", status: "approved", impact: { extraHours: 8, extraCost: 400 } },
    { createdAt: "2026-02-02", status: "implemented", impact: { extraHours: 2.5 } },
    { createdAt: "2026-02-03", status: "new" },
    { createdAt: "2025-12-01", status: "approved", impact: { extraHours: 100 } },
  ];
  const report = computeDrift(baseline, current, changes, "2026-01-01");
  assert.equal(report.added.length, 1);
  assert.equal(report.removed.length, 1);
  assert.deepEqual(report.modified.map((item) => item.fields), [["title"]]);
  assert.equal(report.driftPercent, 75);
  assert.equal(report.level, "high");
  assert.equal(report.approvedChanges, 2);
  assert.equal(report.pendingChanges, 1);
  assert.equal(report.extraHours, 10.5);
  assert.equal(report.extraCost, 400);
});

test("no changes means no drift", () => {
  const items = buildSnapshot([requirement("a", "REQ-001")]);
  const report = computeDrift(items, items, [], "2026-01-01");
  assert.equal(report.driftPercent, 0);
  assert.equal(report.level, "none");
});

function chain(length: number): StoredAuditEntry[] {
  const entries: StoredAuditEntry[] = [];
  let previous = GENESIS_HASH;
  for (let seq = 1; seq <= length; seq += 1) {
    const core: AuditCore = {
      seq, projectId: "p1", at: `2026-01-0${seq}T00:00:00.000Z`, actorId: "u1", action: "task.created",
      entityType: "task", summary: `entry ${seq}`, detail: {},
    };
    const hash = hashEntry(previous, core);
    entries.push({ ...core, prevHash: previous, hash });
    previous = hash;
  }
  return entries;
}

test("audit chain verifies and detects tampering", () => {
  const entries = chain(4);
  assert.deepEqual(verifyChain(entries), { valid: true, checked: 4 });
  const edited = entries.map((entry) => ({ ...entry }));
  edited[1].summary = "rewritten";
  assert.equal(verifyChain(edited).valid, false);
  assert.equal(verifyChain(edited).brokenAtSeq, 2);
  assert.equal(verifyChain([entries[0], entries[2], entries[3]]).valid, false);
});

test("change workflow allows only legal transitions", () => {
  assert.equal(canTransition("new", "under_review"), true);
  assert.equal(canTransition("under_review", "approved"), true);
  assert.equal(canTransition("approved", "implemented"), true);
  assert.equal(canTransition("new", "implemented"), false);
  assert.equal(canTransition("implemented", "new"), false);
  assert.equal(canTransition("bogus", "new"), false);
  assert.deepEqual(allowedTransitions("rejected"), ["under_review"]);
});

test("impact input is validated and rounded", () => {
  assert.deepEqual(parseImpact({ extraHours: "4.256", extraCost: 100, scheduleDays: 2, note: " ok " }), {
    extraHours: 4.26, extraCost: 100, scheduleDays: 2, note: "ok",
  });
  assert.throws(() => parseImpact({ extraHours: -1 }), /Extra hours/);
  assert.throws(() => parseImpact({ extraCost: "abc" }), /Extra cost/);
});

test("CSV escapes quotes, commas and formula injection", () => {
  assert.equal(csvCell('a "b", c'), '"a ""b"", c"');
  assert.equal(csvCell("=SUM(A1:A2)"), "'=SUM(A1:A2)");
  assert.equal(csvCell(null), "");
  assert.ok(toCsv([["a", "b"], [1, 2]]).includes("a,b\r\n1,2"));
});
