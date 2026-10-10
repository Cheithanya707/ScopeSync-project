# ScopeSync — Roadmap and Build Prompt

Status: restructure complete (`src/app`, `src/components`, `src/context`, `src/hooks`, `src/lib`, `src/services`, `src/types`, `src/ui`). `npm run typecheck` and `npm run build` pass.

## Progress
- Phase 1 DONE: `backend/src/scope/drift.ts`, `ScopeBaselinePanel` on the project Requirements page, `/api/scope/projects/:id/baselines|drift`.
- Phase 2 DONE: `changeWorkflow.ts` (legal transitions enforced, 409 otherwise), impact endpoint, `ChangeImpactPanel` on change detail.
- Phase 3 DONE: public `POST /api/public/shares/:token/changes/:changeId/decision`, new share permission `approveChanges`, Approve/Reject in client view. Share expiry/revoke already existed. Password-protected links NOT done.
- Phase 4 DONE: hash-chained `auditLog` (`auditChain.ts`), every task/requirement/change/payment/document write is recorded, verified in the panel.
- Phase 5 DONE: SSE `/api/scope/projects/:id/events` + `useProjectLiveUpdates` hook; the panel refreshes live.
- Phase 6 PARTLY: drift-threshold notifications and CSV export done; PDF export and deadline alerts NOT done.
- Phase 7 PARTLY: rate limiting, new `scope/` and `middleware/` modules, 9 backend tests. Existing `dataApi.ts` not split yet.
- Phase 8 NOT started (logo merge, features/ folders, alias cleanup, dev pages).

## Problem this product solves
Scope creep and unrecorded project changes. Freelancers, agencies, student and startup teams lose time and money when clients ask for extras that are never written down, priced or approved. ScopeSync keeps one traceable record: what was agreed, what changed, who approved it, and what it affects.

## Hard rules
- Do NOT change existing page content/copy, the blue / white / black theme, or the logo.
- No AI features inside the product. AI is only a development tool.
- Do not rewrite working logic. Extend it. Keep changes small and typed.
- After each phase run `npm run typecheck`, `npm run build`, `npm run backend:test`, and fix before moving on.

## Phase 1 — Scope baseline snapshots
- Lock the agreed requirements as a numbered baseline version.
- Compare current scope against any baseline; compute drift score by rules (added / removed / modified items, hours, cost). No AI.
- Reuse existing `DriftGauge` and `StatusStamp` in `src/ui/primitives.tsx`.

## Phase 2 — Change-request workflow with impact
- Each change records extra hours, extra cost, affected requirements and tasks.
- States: submitted -> reviewed -> approved / rejected. Block invalid transitions in the backend.

## Phase 3 — Client approval by secure share link
- Extend existing `/share/[shareToken]`: expiry, revoke, optional password, no login needed.
- Client can approve / reject with a comment; record IP-less timestamp and token id.

## Phase 4 — Tamper-evident audit trail (backend)
- Append-only log; each entry stores hash of previous entry. Verify endpoint.
- Surface in existing `/activity`.

## Phase 5 — Real-time updates
- Server-Sent Events endpoint in backend; client hook in `src/hooks` to live-update changes, approvals, comments.

## Phase 6 — Alerts and exports
- Deadline and drift-threshold notifications (existing `/notifications`).
- CSV and printable PDF export of scope history for clients.

## Phase 7 — Backend hardening
- Split `backend/src` into `routes/`, `middleware/`, `services/`, `db/`.
- Add request validation, rate limiting, security headers, error handler, and tests.

## Phase 8 — Frontend polish
- Merge duplicate Logo components, unify `components/ui` and `src/ui`, remove the temporary `@/src/*` alias in `tsconfig.json` after rewriting `@/src/ui/...` imports to `@/ui/...`.
- Group each feature (tasks, changes, documents, payments) into `src/features/<name>/`.
- Remove or protect dev-only pages (`/design-system`, `/mcp`). Review `/ai-insights` against the no-AI rule.
- Accessibility, empty/loading/error states, mobile layout.

---

## Prompt to paste into VS Code (Claude Code)

```
You are working in the ScopeSync repo (Next.js 16 / React 19 frontend in src/, Node backend in backend/).
Read CLAUDE.md, AGENTS.md, PROJECT_OVERVIEW.md and ROADMAP.md first.

Goal: finish the project by implementing the phases in ROADMAP.md, one phase at a time, starting with Phase 1.

Rules:
- Do not change existing content, copy, the blue/white/black theme, or the logo.
- No AI features inside the product.
- Extend existing code; do not rewrite working logic.
- Reuse components in src/ui and existing services in src/services.
- Backend changes go in backend/ with tests (npm run backend:test).
- After each phase run: npm run typecheck && npm run build && npm run backend:test. Fix every error before continuing.
- Summarize what changed after each phase and stop for review.
```
