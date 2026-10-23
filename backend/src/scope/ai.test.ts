import assert from "node:assert/strict";
import test from "node:test";
import { parseAnalysis, parseImpactSuggestion, parseJsonText } from "./aiClient.js";
import { classifyDeadline } from "./deadlineAlerts.js";

test("model output is parsed from fenced JSON and validated", () => {
  const raw = parseJsonText('```json\n{"summary":"Looks risky.","healthScore":140,"risks":[{"title":"Drift","severity":"bogus","detail":"d","recommendation":"r"},{"title":""}],"nextActions":["Do x",""]}\n```');
  const analysis = parseAnalysis(raw);
  assert.equal(analysis.healthScore, 100);
  assert.equal(analysis.risks.length, 1);
  assert.equal(analysis.risks[0].severity, "medium");
  assert.deepEqual(analysis.nextActions, ["Do x"]);
});

test("unreadable or empty model output is rejected", () => {
  assert.throws(() => parseJsonText("not json"), /could not be read/);
  assert.throws(() => parseAnalysis({ summary: "" }), /no summary/);
  assert.throws(() => parseImpactSuggestion({ extraHours: 3 }), /no rationale/);
});

test("impact suggestion is clamped to sane numbers", () => {
  const result = parseImpactSuggestion({ extraHours: -4, scheduleDays: "2.2", rationale: "Because.", clientMessage: "Hello" });
  assert.equal(result.extraHours, 0);
  assert.equal(result.scheduleDays, 2);
  assert.equal(parseImpactSuggestion({ extraHours: 6.13, rationale: "x" }).extraHours, 6.25);
});

test("deadline classification", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  assert.equal(classifyDeadline("2026-10-09", now), "overdue");
  assert.equal(classifyDeadline("2026-10-10", now), "due_soon");
  assert.equal(classifyDeadline("2026-10-12", now), "due_soon");
  assert.equal(classifyDeadline("2026-10-13", now), null);
  assert.equal(classifyDeadline(undefined, now), null);
  assert.equal(classifyDeadline("soon", now), null);
});
