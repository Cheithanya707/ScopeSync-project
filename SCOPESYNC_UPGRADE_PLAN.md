# ScopeSync: Upgrade Blueprint + VS Code Prompts

> Assumption: AI is used **to build and fix** the project, but **no AI/LLM features ship inside the product**.
> "Smart" behaviour comes from deterministic algorithms (graphs, rules, scoring, statistics) that are explainable, free to run, and work offline.

---

## 1. Vision

**ScopeSync = the open, traceable "source of truth" for any collaborative work where scope changes.**

Real-world problems it targets (each becomes a template/vertical, same core engine):

| World problem | How ScopeSync solves it |
|---|---|
| Construction / public infrastructure overruns | Baselined scope, change-order approval chain, cost + schedule impact per change |
| NGO / disaster-relief coordination | Offline-first field use, task ownership, resource and participant registers, low-bandwidth mode |
| Software/agency scope creep and client disputes | Signed baselines, change requests with price/time impact, immutable audit trail, client portal |
| Health campaigns, vaccination drives, events | Event module, teams, schedules, participants, deadlines |
| Education / research group projects | Requirement-to-task traceability, milestones, contribution visibility |
| Freelancer payment disputes | Linked scope, deliverables, approvals, manual payment ledger and receipts |

Core promise: **every requirement, change, task, date, document and payment is linked, versioned, and explainable.**

---

## 2. Problems found in the current project (fix first)

| # | Problem | Fix |
|---|---|---|
| P0-1 | No backend or `.env.example` in repo | Add `/backend` (Flask) or a documented API contract (OpenAPI), `.env.example`, docker-compose |
| P0-2 | "Standalone preview" claims browser-only data but has no local store | Build a real local adapter (IndexedDB via Dexie) implementing the same service interface as the API |
| P0-3 | Fixed `PREVIEW_WORKSPACE_ID` used across services/pages | Single `useActiveWorkspace()` hook; remove the constant; ESLint rule to forbid it |
| P0-4 | Auth guard is client-only | Add Next.js `middleware.ts` + httpOnly cookie session; backend enforces RBAC |
| P0-5 | `requestLocalData` name is misleading | Rename to `requestApi`; create a true `DataSource` interface |
| P1-1 | No tests | Vitest + Testing Library + Playwright + MSW contract mocks |
| P1-2 | Firebase dependency unused, empty file | Remove |
| P1-3 | Placeholder features visible (MCP, Google, Upgrade, delete account, public share) | Implement, or hide behind feature flags with honest labels |
| P1-4 | `[section]` fallback "Coming in a future step" | Remove or replace with real 404 |
| P1-5 | Token in localStorage | Move to httpOnly cookie + CSRF protection |
| P2 | Accessibility, i18n, performance not verified | axe checks, next-intl, Lighthouse budget, bundle analysis |

---

## 3. Target frontend architecture (arrangement)

```
src/
  app/
    (marketing)/            # public pages
    (auth)/                 # login, signup, reset, onboarding
    (app)/                  # authenticated shell
      dashboard/ projects/ tasks/ calendar/ people/ ...
    share/[token]/
  features/                 # feature-sliced: each owns UI + hooks + service + types + tests
    projects/ tasks/ requirements/ changes/ documents/
    payments/ calendar/ people/ events/ sharing/ notifications/ activity/
  core/
    api/                    # apiClient, error types, interceptors
    data/                   # DataSource interface, ApiDataSource, LocalDataSource
    auth/ workspace/ permissions/ theme/ i18n/ flags/
  ui/                       # design system: Button, Input, Dialog, Table, Toast, EmptyState...
  lib/                      # pure utilities (dates, money, graph, scoring)
  tests/                    # e2e + fixtures
```

Rules:
1. Pages are thin; logic lives in `features/*`.
2. Data goes through TanStack Query hooks, never raw `fetch` in components.
3. All forms: React Hook Form + Zod schemas shared with types.
4. One `DataSource` interface; API and IndexedDB implementations are swappable by env flag.
5. Every route has loading, empty, error and forbidden states.
6. Permissions checked via `can(action, resource)`, UI hides what the server would reject.

---

## 4. Advanced features (all deterministic, no AI)

### 4.1 Traceability engine
- Requirement -> Task -> Change -> Document -> Payment link graph.
- **Impact analysis**: select a change, see every affected requirement, task, date, and payment (graph traversal).
- **Orphan detector**: requirements without tasks, tasks without requirements, tasks with no owner.
- Traceability matrix view and CSV/PDF export.

### 4.2 Scope control
- **Baselines**: freeze scope at kickoff; compare current vs baseline (diff view).
- **Scope-creep index** = (added + modified requirements since baseline) / baseline count, with trend chart.
- Change-request workflow with configurable approval chain (multi-approver, quorum, SLA timers).
- Effort/cost/time impact fields on every change, rolled up automatically.

### 4.3 Scheduling and delivery metrics
- Task dependencies, **critical path (CPM)**, float/slack, auto-flag slipping dates.
- Gantt + Kanban + calendar + timeline views of the same data.
- **Earned value (PV/EV/AC, SPI/CPI)** from tasks and payment records.
- Burn-up chart showing scope line vs completed line.
- Rule-based **health score** (overdue %, blocked %, scope-creep, budget variance) with explanation of each factor.

### 4.4 Risk and decision log
- Risk register (probability x impact matrix, owner, mitigation, due date).
- Decision log (ADR-style): what, why, who, linked requirements.
- Assumptions and dependencies register.

### 4.5 Collaboration and trust
- Immutable **audit trail** with field-level diffs and "who/when/why".
- Comments with @mentions on any entity; threaded; resolve.
- Real-time presence and updates (WebSocket/SSE).
- Client portal: read-only or approve/reject, expiring share links, watermarking, access log.
- Digital approval/sign-off with timestamp and hash of the baseline.

### 4.6 Offline-first and low-bandwidth (global reach)
- PWA, service worker, IndexedDB cache, **mutation queue with conflict resolution**.
- Low-data mode: no heavy images, paginated lists.
- Field use on phones: large tap targets, camera upload for documents.

### 4.7 Global and inclusive
- i18n (English, Tamil, Hindi, Spanish, Arabic with RTL), locale-aware dates/currency/time zones.
- WCAG 2.2 AA: keyboard navigation, focus management, contrast, screen-reader labels, reduced motion.

### 4.8 Productivity
- Command palette (Ctrl+K), global search (client-side index e.g. MiniSearch + server search).
- Saved views and filters, bulk edit, drag-and-drop reordering.
- Import/export: CSV, XLSX, JSON, iCal; Jira/Trello CSV importers.
- Project templates (construction, software, event, NGO relief, research).
- Webhooks and a public REST API with API keys (integration without AI).
- Notification rules + email digests (backend), in-app preferences.

### 4.9 Payments (honest scope)
- Keep as ledger: invoices, milestones, receipts, status, tax fields, multi-currency. Optional Stripe/Razorpay later behind a flag.

---

## 5. Quality, security, performance

- **Tests**: unit (Vitest), component, e2e (Playwright: signup -> project -> task -> change -> approval), contract tests with MSW against OpenAPI.
- **CI** (GitHub Actions): lint, typecheck, test, build, Lighthouse CI, `npm audit`.
- **Security**: httpOnly cookies, CSRF, CSP headers, input sanitisation, file type/size validation, rate limiting (backend), RBAC + workspace scoping on every query.
- **Performance**: server components where possible, route-level code splitting, virtualised long lists, image optimisation, budgets (LCP < 2.5s, JS < 200KB per route).
- **Observability**: error boundary reporting hook, Web Vitals logging.

---

## 6. Roadmap

| Phase | Goal | Done when |
|---|---|---|
| 1. Stabilise | Fix P0 items, folder refactor, workspace ID, DataSource, env template | App runs end to end locally with seed data |
| 2. Prove | Tests, CI, auth cookies, RBAC, remove placeholders | CI green, e2e core flow passes |
| 3. Differentiate | Traceability graph, baselines, impact analysis, approvals, audit trail | Demo: change request shows full impact |
| 4. Scale | Scheduling (CPM, Gantt), EVM, risks, decisions, offline PWA | Works offline, metrics correct vs test fixtures |
| 5. Reach | i18n, a11y, templates, import/export, API + webhooks, client portal | Lighthouse a11y >= 95, 3 vertical templates |

---

## 7. Prompts to feed VS Code

Use with GitHub Copilot Chat (Agent mode), Claude Code, or Cline. Put **Prompt 0** in `.github/copilot-instructions.md` (or `CLAUDE.md`) so it applies to every request, then run Prompts 1-8 one at a time. Commit after each.

### Prompt 0: Project rules (persistent)

```
You are a senior full-stack engineer working on ScopeSync, a Next.js 16 (App Router) + React 19 + TypeScript + Tailwind project/requirements/scope-management app with a separate Flask API.

Hard rules:
- Do NOT add any AI/LLM/ML features or provider SDKs to the product. "Smart" features must be deterministic algorithms (graph traversal, rules, scoring, statistics).
- Strict TypeScript, no `any`. Validate input with Zod. Forms use React Hook Form.
- Use feature-sliced structure: src/features/<name>/{components,hooks,service,types,tests}. Pages in app/ stay thin.
- All server data via TanStack Query hooks over a DataSource interface (ApiDataSource and LocalDataSource). No raw fetch in components.
- Never use a hard-coded workspace ID; use useActiveWorkspace().
- Every screen has loading, empty, error, and forbidden states, and is keyboard accessible (WCAG 2.2 AA) and responsive.
- Write or update tests for every change. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` before declaring done, and fix failures.
- Make small, reviewable changes. Explain what you changed and why at the end. Do not invent endpoints: if the backend contract is unknown, define it in docs/openapi.yaml first.
```

### Prompt 1: Audit and stabilise

```
Audit this repo against SCOPESYNC_UPGRADE_PLAN.md section 2 (P0/P1 problems). Produce docs/AUDIT.md listing each problem with file paths and line references. Then fix in this order: (1) remove PREVIEW_WORKSPACE_ID everywhere and introduce useActiveWorkspace(); (2) rename requestLocalData to requestApi and introduce a DataSource interface in src/core/data; (3) delete unused Firebase dependency and empty files; (4) remove or feature-flag placeholder UI (MCP, Google sign-in, Upgrade, account deletion, [section] fallback) with honest labels; (5) add .env.example and README setup. Keep the app building after each step.
```

### Prompt 2: Re-architect folders

```
Refactor the codebase into the feature-sliced structure in SCOPESYNC_UPGRADE_PLAN.md section 3 without changing behaviour. Move services, types, and components into src/features/*, shared primitives into src/ui, infra into src/core. Update imports, keep route URLs identical, add barrel exports, and add an ESLint boundary rule so features cannot import from each other's internals. Run build and typecheck.
```

### Prompt 3: Real local mode + backend contract

```
Implement LocalDataSource using IndexedDB (Dexie) that implements the same DataSource interface as ApiDataSource for projects, tasks, requirements, changes, documents (blobs), payments, members, activity, and notifications. Add NEXT_PUBLIC_DATA_MODE=local|api. In local mode, seed realistic demo data (a construction project and a software project) and make login create a local user. Also write docs/openapi.yaml describing every endpoint the frontend uses, and a minimal Flask reference backend in /backend (SQLAlchemy, JWT in httpOnly cookie, workspace-scoped queries, RBAC) plus docker-compose.yml. Add MSW handlers generated from the OpenAPI spec for tests.
```

### Prompt 4: Auth and permissions

```
Replace localStorage token storage with httpOnly cookie sessions. Add middleware.ts route protection, CSRF handling, and a permissions module can(action, resource) with roles owner/admin/manager/member/client/viewer. Gate every button and route with it. Add tests for each role on tasks, changes, documents, payments, and sharing.
```

### Prompt 5: Traceability + scope control

```
Build src/lib/graph and src/features/traceability: a typed link graph over requirements, tasks, changes, documents, and payments. Implement impact analysis (given a change, return affected entities with depth), orphan detection, and a traceability matrix page with CSV export. Add baselines: freeze scope, store snapshot, diff view (added/removed/modified), and a scope-creep index with a trend chart. Add multi-step approval chains with quorum and SLA due dates on change requests. Unit-test all algorithms with fixtures.
```

### Prompt 6: Scheduling and metrics

```
Add task dependencies (FS/SS/FF/SF with lag), a critical path method implementation in src/lib/schedule with float calculation, Gantt, Kanban, and timeline views over the same data, and an earned value dashboard (PV, EV, AC, SPI, CPI, EAC) from tasks and payment records. Add a rule-based health score where each factor and weight is shown to the user in an explanation panel. Include a burn-up chart. Test with known textbook examples.
```

### Prompt 7: Collaboration, audit, offline

```
Add an immutable audit trail with field-level diffs for all entities, threaded comments with @mentions, real-time updates via SSE with polling fallback, and a client portal (expiring tokens, scoped permissions, access log, approve/reject). Convert the app into an installable PWA with a service worker, offline read cache, and a mutation queue with conflict resolution UI. Add risk register (probability x impact matrix) and decision log.
```

### Prompt 8: Reach and polish

```
Add next-intl with English, Tamil, Hindi, Spanish, Arabic (RTL), locale-aware dates/currency/time zones; a Ctrl+K command palette with client-side search (MiniSearch); saved views; bulk edit; CSV/XLSX/iCal import-export; project templates (construction, software, event, NGO relief, research); webhooks and API keys. Run axe on all routes in Playwright and fix violations. Add Lighthouse CI budgets and a GitHub Actions pipeline (lint, typecheck, test, e2e, build, audit).
```

### Prompt 9: Review loop (reuse after each phase)

```
Review the diff of the last phase as a strict code reviewer. List bugs, security issues, accessibility gaps, missing tests, dead code, and spec deviations from SCOPESYNC_UPGRADE_PLAN.md. Fix everything you find, re-run all checks, and summarise remaining risks.
```

---

## 8. Definition of done

- `npm run lint && npm run typecheck && npm test && npm run build` all pass; e2e green in CI.
- Works in both `local` and `api` modes with the same UI.
- Two workspaces cannot see each other's data (tested).
- No placeholder feature is presented as live.
- Demo script: create project -> import requirements -> baseline -> raise change -> see impact -> approve via chain -> client approves in portal -> audit trail and metrics update.
