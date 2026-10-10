# ScopeSync Frontend: Project Overview

## Executive summary

ScopeSync is a Next.js 16 / React 19 project and requirements-management frontend. It presents a workspace dashboard and workflows for projects, tasks, requirements, scope changes, documents, payments, calendars, teams, event management, notifications, a project marketplace, and client sharing.

**Verdict:** the repository includes a separate Express API backed by MongoDB and Firebase Authentication for email/password and Google sign-in. End-to-end use requires a configured Firebase project and a running MongoDB Community Server; MongoDB Compass is a client, not the database server. The local demo remains a read-only dashboard with illustrative sample data. MCP connections and AI analysis providers are not configured by this repository.

## Project problem statement

### The problem

Project teams often manage requirements, decisions, tasks, deadlines, documents, budgets, and stakeholder communication in separate tools or manually maintained records. As a project changes, these records can become disconnected: a requirement change may not be reflected in the related tasks or schedule, ownership can become unclear, and clients or team members may not know which information is current. This fragmentation makes it harder to understand project status, assess the impact of changes, coordinate work, and keep delivery aligned with the agreed scope.

### Problem statement

**How might we give project teams one shared, traceable workspace where project requirements, scope changes, tasks, schedules, documents, payments, and team responsibilities stay connected—so that teams can coordinate delivery, understand the status and impact of project work, and keep stakeholders aligned from kickoff through handoff?**

### Why it matters

- **Unclear source of truth:** project information is spread across records and workflows, making it harder to know what is current.
- **Weak traceability:** requirements, requested changes, assigned work, and due dates need to be understood in relation to one another.
- **Coordination overhead:** teams need visibility into owners, progress, upcoming dates, and activity without repeatedly reconciling updates.
- **Stakeholder misalignment:** clients and collaborators need an appropriate view of project information and changes.
- **Delivery uncertainty:** when scope, tasks, dates, and payment records are difficult to review together, planning and follow-up become less reliable.

### How ScopeSync addresses the problem

ScopeSync is designed to bring these workflows into a project-centered workspace. The frontend includes project overviews, requirement and change registers, linked tasks, team management, calendars, documents, manual payment records, activity history, notifications, and project-sharing controls. Its goal is to make project information easier to organize, navigate, and review in context.

**Important presentation note:** describe this as the problem ScopeSync is designed to solve, not as a proven outcome. Live persistence and end-to-end behavior depend on a compatible backend, and the current frontend does not provide active AI analysis or external Google/MCP connections.

### Short version for a presentation slide

> Project information is fragmented across tools, so requirements, changes, tasks, schedules, and stakeholder updates can lose alignment. ScopeSync aims to provide one traceable project workspace that connects this information and helps teams coordinate delivery around a shared view of the work.

## At a glance

| Area | What is present |
|---|---|
| Frontend framework | Next.js App Router, React, TypeScript, Tailwind CSS |
| UI foundation | Responsive application shell, sidebar/mobile navigation, reusable buttons and inputs, icon set, light/dark/system themes, compact-mode preference |
| Main product areas | Dashboard, projects and marketplace, tasks, requirements, changes, calendar, people, documents, payments, events, activity, notifications, settings |
| Authentication | Firebase email/password and Google sign-in; ScopeSync profiles and workspace data are synchronized to MongoDB |
| Data layer | Typed service modules call a remote API through a shared fetch client |
| Backend in this repository | Express API in `backend/`, using MongoDB and Firebase ID-token verification |
| Database | Local MongoDB Community Server; Compass can inspect the `scopesync` database |
| AI/MCP integrations | Screens and demo/fixture content exist; live AI/MCP providers are not configured |
| Automated checks | `npm run lint`, `npm run typecheck`, `npm run build`, `npm run backend:build`, and `npm run backend:test` |
| Automated tests | Backend route-resolution tests; no frontend behavior tests are configured |

## How someone moves through the app

1. `/` is the public marketing page. Its sections explain the product and lead to signup/login.
2. With a configured API, a visitor can sign up or log in. The frontend stores the returned user and access token in browser storage.
3. Onboarding selects a work use case and workspace name, then asks the API to create/associate the workspace and update the profile.
4. Authenticated routes use the shared workspace shell. Its navigation opens the dashboard, projects, marketplace, upload, chatbot/AI insights, MCP screen, notifications, settings, and help.
5. Project actions lead into project-specific areas for requirements, tasks, scope changes, calendar, documents, payments, team, sharing, or event operations.
6. Writes generally go to the API and then emit activity events; some task assignments also create notifications.

The route guard is client-side. This frontend code alone does not demonstrate server-side access control; authorization must also be enforced by the backend.

## Shared navigation and global controls

- **Desktop sidebar / mobile menu:** Dashboard, My Projects, Find Projects, Upload Project, Chatbot/AI insights, MCP, Notifications, Settings, Help.
- **Notifications:** notification center entry point; notification items can navigate to their related record.
- **Profile menu:** account/profile controls and sign out.
- **Upgrade:** visible but disabled in standalone-preview mode.
- **Theme / appearance:** light, dark, or system appearance; compact-mode preference is available in settings.
- **Route feedback:** workspace screens share loading/error/empty states and an activity-sync notice. Preview banners currently say data is saved only in the browser.

## Page and screen inventory

“Wired” below means the frontend has navigation, event handlers, or service calls. Live authentication and data operations still require a configured Firebase project and a running local API/database.

### Public, account, and workspace pages

| Route | What the page offers | Main controls / behavior |
|---|---|---|
| `/` | Product landing page with hero, features, use cases, demonstrations, scope timeline, and final call to action | Landing navigation and signup/login calls to action; demos are illustrative marketing UI |
| `/login` | Existing-user sign-in | Firebase email/password and Google sign-in, with links to signup and password reset; requires the Firebase web config and running API |
| `/signup` | Account creation | Firebase email/password and Google sign-in, with links back to login; requires the Firebase web config and running API |
| `/forgot-password` | Request password-reset email | Email input and submit; Firebase Authentication sends the reset email |
| `/onboarding` | Choose a use case and name the workspace | Use-case radio options, workspace-name input, **Continue**; API-backed workspace/profile setup |
| `/dashboard` | Workspace summary, marketplace/application totals, projects, people, deadlines, recent activity | **Create Project**, **Find projects**, project/application summary links, project/team/calendar shortcuts, **View all activity** |
| `/activity` | Workspace activity history | Search and entity/action/project filters, activity timeline, **Back to dashboard** |
| `/notifications` | Workspace notification inbox | **All / Unread**, **Mark all as read**, open a notification (mark read and follow its related link) |
| `/tasks` | User task list | Search, status/priority/due-date filters, task cards linking to project task details |
| `/calendar` | Cross-project calendar and upcoming dates | Calendar display controls and filters; event rows link to the relevant project/task/change/payment |
| `/people` | Workspace member directory | Search, **Add Person**, open a member profile |
| `/people/new` | Add/invite a workspace member | Member fields, submit, cancel |
| `/people/[memberId]` | Member profile and project context | Profile/details and navigation into related team/project views |
| `/people/[memberId]/edit` | Edit member information | Save and cancel |
| `/requirements` | Requirements grouped by project | **Open requirements** links to a project’s requirement manager |
| `/changes` | Scope changes grouped by project | **Review changes** links into project change management |
| `/documents` | Workspace document list | Search/filter, choose project where needed, upload, open/download, delete |
| `/payments` | Workspace payment records | Search/filter, add a payment, mark paid, delete |
| `/ai-insights` | Project health signals and suggestions | **Refresh** and project/action links; current results are frontend-derived signals, not provider-generated AI |
| `/mcp` | Connector cards for Gmail, Google Sheets, Google Drive, local files | Connection status is “Not connected”; **Backend required** controls are disabled |
| `/help` | Static FAQ and quick links | Links to projects, requirements, settings, and documents |

### Projects and marketplace

| Route | What the page offers | Main controls / behavior |
|---|---|---|
| `/projects` | “My Projects” list and project status | Search/filter, project cards, **Upload opportunity**, **Create workspace project** |
| `/projects/new` | Multi-step project creation | Project type/category, project details, review/plan step, **Back**, **Cancel**, continue/next, **Create Project** |
| `/projects/find` | Marketplace opportunity search | Search and filters for category/type, skills, location/remote, experience, budget, deadline, and sort; links to details and application lists |
| `/projects/find/[listingId]` | Opportunity detail | View description/owner/skills; application message and experience/timeline/budget details; **Apply to this project** where applicable |
| `/projects/upload` | Create and manage marketplace listings | Listing editor, save draft, preview, edit, publish/pause, view listing, review applications |
| `/projects/applications` | Applications received by a listing owner | View applicant details; **Shortlist**, **Accept and start project**, **Reject**, **View listing** |
| `/projects/my-applications` | Current user's submissions and status | View opportunity, withdraw pending/shortlisted application, open accepted project workspace |
| `/projects/workspace/[projectId]` | Compatibility route | Redirects to `/projects/[projectId]`; it is not a separate workspace screen |

### Project workspace and project-specific pages

`[projectId]`, `[taskId]`, `[changeId]`, `[documentId]`, `[paymentId]`, and `[participantId]` are dynamic path values, not literal text to type into a URL.

| Route | What the page offers | Main controls / behavior |
|---|---|---|
| `/projects/[projectId]` | Project summary, stats, upcoming dates, recent activity | **Edit project**, client access, **Delete project**; event projects also link to event management |
| `/projects/[projectId]/edit` | Project information editor | **Save changes**, **Cancel** |
| `/projects/[projectId]/calendar` | Calendar limited to one project | Calendar controls and filters |
| `/projects/[projectId]/people` | Project team roster | Add/manage project members |
| `/projects/[projectId]/requirements` | Project requirement register | Add/edit/status workflows and requirement details |
| `/projects/[projectId]/tasks` | Project task list | Search/filter, **Add task**, open task detail |
| `/projects/[projectId]/tasks/new` | New task form | Task details, status, priority, assignee, due date, estimate, optional requirement link; **Create Task**, **Cancel** |
| `/projects/[projectId]/tasks/[taskId]` | Task detail | Status selector, **Mark Complete**, **Edit**, **Delete**, linked change navigation |
| `/projects/[projectId]/tasks/[taskId]/edit` | Task editor | Edit task/assignee/requirement link; **Save changes**, **Cancel** |
| `/projects/[projectId]/changes` | Scope-change register | Review and open change requests |
| `/projects/[projectId]/changes/new` | New scope-change request | Change details and optional requirement/task links; **Create Change Request**, **Cancel**; AI analysis is explicitly future work |
| `/projects/[projectId]/changes/[changeId]` | Change request details and review panel | **Edit** when allowed, **Delete**, review/approve/reject/implement/cancel actions, review notes |
| `/projects/[projectId]/changes/[changeId]/edit` | Scope-change editor | Update change details/links; **Save changes**, **Cancel** |
| `/projects/[projectId]/documents` | Project documents | Search/filter, upload, open/download, delete |
| `/projects/[projectId]/documents/[documentId]` | Document details | **Open** (supported file types), **Download**, **Edit**, **Delete** |
| `/projects/[projectId]/documents/[documentId]/edit` | Document metadata editor | Name/description and client-share availability; **Save changes**, **Cancel** |
| `/projects/[projectId]/payments` | Project payment list and summary | Filters, add payment, mark paid, delete |
| `/projects/[projectId]/payments/new` | New manual payment record | Payment fields, submit, cancel; this records payment status and does not transfer money |
| `/projects/[projectId]/payments/[paymentId]` | Payment details | View record and available payment actions |
| `/projects/[projectId]/payments/[paymentId]/edit` | Payment editor | Save/cancel payment changes |
| `/projects/[projectId]/sharing` | Manage project shares | **Share Project**, revoke/restore actions with confirmation |
| `/projects/[projectId]/sharing/new` | Create a share | Recipient, role, and permission options; public access depends on trusted backend support |
| `/projects/[projectId]/[section]` | Fallback for unmatched project sections | “Coming in a future step” message and **Back to overview**; dedicated routes above are the real section screens |

### Event-management pages

Available beneath an event project. These use the shared event-management UI and event services.

| Route | What the page offers | Main controls / behavior |
|---|---|---|
| `/projects/[projectId]/event` | Event overview, setup status, summary, upcoming tasks | Links to setup, participants, schedule, and teams |
| `/projects/[projectId]/event/setup` | Dates, venue, and event/registration settings | Edit and save/update event setup |
| `/projects/[projectId]/event/participants` | Participant register | View/manage participants and add a participant |
| `/projects/[projectId]/event/participants/new` | Add participant | Participant form and submit/cancel |
| `/projects/[projectId]/event/participants/[participantId]` | Participant details | View participant and available actions |
| `/projects/[projectId]/event/participants/[participantId]/edit` | Edit participant | Save/cancel |
| `/projects/[projectId]/event/schedule` | Event schedule list | View and manage schedule items |
| `/projects/[projectId]/event/schedule/new` | Add schedule item | Schedule form and submit/cancel |
| `/projects/[projectId]/event/teams` | Event teams and membership | View/manage teams and members |
| `/projects/[projectId]/event/teams/new` | Create event team | Team form and submit/cancel |

### Settings and external share

| Route | What the page offers | Main controls / behavior |
|---|---|---|
| `/settings` | Settings entry route | Redirects to `/settings/profile` |
| `/settings/profile` | Profile details and photo | Edit fields, upload/remove photo, **Save changes** |
| `/settings/account` | Account/session controls | **Log out** |
| `/settings/workspace` | Workspace profile and logo | Name/type, upload/change/remove logo, save; owner restrictions apply |
| `/settings/preferences` | Defaults for project/calendar/task views | Select preferences, **Save preferences** |
| `/settings/appearance` | Theme/appearance | Choose appearance mode; the selected theme is stored in browser storage |
| `/settings/security` | Password-reset and account-deletion information | **Send password reset email** is wired to the API; deletion is presented as information/confirmation, not an implemented delete-account operation |
| `/share/[shareToken]` | External client view | Public API routes support active, unexpired project shares and permission-checked shared documents/change requests |

### Framework/error routes

| Surface | What it does |
|---|---|
| Not found (404) | Not-found message and **Return to ScopeSync** |
| Route error boundary | Shared error fallback with recovery/reset action |
| Global error boundary | Root-level error fallback with recovery/reset action |

## Connectivity and data flow

### API connection

- `NEXT_PUBLIC_API_URL` is the required base URL. `lib/apiClient.ts` throws a clear configuration error when it is absent.
- Requests use browser `fetch`; the client attaches the saved bearer token to authenticated requests.
- `/api/health`, `/api/auth/...`, and `/api/public/...` are sent directly to the base URL. Most data requests that begin `/api/...` are rewritten to `/api/data/...`.
- An authenticated `401` clears the saved token and user and broadcasts an auth-change event. Network and invalid-response failures are surfaced as API errors.
- The separate Express API is in `backend/`. End-to-end login and persistence require a Firebase project and a running MongoDB Community Server. Verify API/database connectivity at `/api/health`.

### Data areas that use the API

Account/profile and workspace setup; projects; marketplace listings/applications; project tasks; requirements; scope changes; members; calendars/events; documents and file transfer; manual payment records; activity; notifications; preferences; and project-share management.

Representative endpoint families referenced by the frontend include:

| Capability | Example paths |
|---|---|
| Authentication | `/api/auth/signup`, `/api/auth/login`, `/api/auth/password-reset` |
| User/workspace | `/api/users/me`, `/api/workspaces`, `/api/workspaces/{workspaceId}/members` |
| Projects/tasks | `/api/v1/projects`, `/api/projects/{projectId}/tasks` |
| Project content | `/api/projects/{projectId}/requirements`, `/api/projects/{projectId}/scopeChanges`, `/api/projects/{projectId}/documents`, `/api/projects/{projectId}/payments` |
| Marketplace | `/api/marketplace/listings`, `/api/marketplace/applications`, `/api/my-projects` |
| Activity/notifications | `/api/activities`, `/api/notifications` |
| External shares | `/api/public/shares/{token}`, `/api/project-shares` |

Most of these data paths are rewritten by the client to `/api/data/...` before being sent. The backend must expose the contract the frontend expects.

### Browser storage vs. server data

- `localStorage` stores the serialized session user and access token, plus appearance/compact-mode settings and a few onboarding/appearance preferences.
- Business records are **not** stored in a browser database by `requestLocalData`; despite its name, it delegates directly to the remote API client.
- Documents upload with `FormData` and download as blobs.
- Activity events are recorded through the API after a business action. Task assignment can additionally create a notification through the API.

## Connectivity options and limitations

| Connection/feature | Current state |
|---|---|
| ScopeSync backend API | Express service in `backend/`; configure the provided environment files and run `npm run dev:full` |
| Email/password and Google sign-in | Firebase Authentication; enable both providers in the Firebase Console |
| Password reset | Firebase Authentication sends the reset email |
| Gmail / Google Sheets / Google Drive | MCP page only; no OAuth connection, authorization, or active connector |
| Local-file MCP | UI only; needs a trusted MCP/backend service and is disabled |
| AI insights | No provider connected; service returns empty insights/no-provider messaging. Existing mock insight fixtures are not evidence of live analysis |
| AI scope-change analysis | Future step/placeholder |
| Client/public project shares | Express API supports public project shares, expiration/revocation, and permission-gated actions |
| Payments | Manual project payment records/status only; no money movement or payment processor |
| Firebase | Client sign-in and server-side ID-token verification are implemented; project credentials and provider setup are external prerequisites |

## Project health: what is good and what blocks a confident presentation

### Positive

- The frontend is broad, organized into route groups, components, contexts, service modules, and typed domain models.
- Most workspace and project workflows have real forms, validation, navigation, loading/error states, and API service calls rather than being static mock screens.
- Shared layouts include responsive navigation, theme support, and reusable UI elements.
- The current code passes the available static checks and production compilation.

### Must resolve or clearly disclose

1. **Local infrastructure and Firebase credentials are required.** Configure a Firebase project and run MongoDB Community Server before verifying live sign-in and persistence.
2. **Local demo is limited.** The explicitly labeled sample dashboard is read-only; workspace data is stored in MongoDB when the API is running and configured.
3. **Workspace ID usage needs an integration pass.** The workspace context fetches a real profile/workspace ID, but multiple pages and services still pass the fixed `PREVIEW_WORKSPACE_ID` (`scopesync-local-preview`) into project/member/calendar/data calls. Verify and replace those call sites with the active workspace ID before testing real multi-workspace accounts.
4. **Several features are visibly placeholders.** MCP connectors, provider-generated AI analysis, account deletion, and Upgrade are not active. State this in a presentation rather than demonstrating them as complete features.
5. **No automated behavior tests are present.** Add focused API/auth/project-flow tests and backend contract/integration checks before relying on this frontend for production workflows.
6. **Production operations still need review.** Confirm server-side authorization and workspace scoping, file validation/storage, token lifecycle, CORS, and secret/configuration handling before deployment. The frontend client guard is not a substitute for backend authorization.

## Local setup and presentation checklist

1. Install dependencies with `npm install`.
2. Copy `.env.local.example` to `.env.local` and `backend/.env.example` to `backend/.env`. Fill in the Firebase web app values and matching project ID.
3. If the backend is unavailable, use **Use local demo mode** on the workspace setup screen to open the read-only sample dashboard; other workspace routes require the backend.
4. Start both services with `npm run dev:full` and confirm `http://127.0.0.1:5000/api/health` reports `"database":"connected"`.
5. Sign up or use Google, complete onboarding, create workspace records, then verify persistence in Compass after refresh.
6. Verify workspace isolation with at least two accounts/workspaces before production use.
7. MCP connectors and AI provider integrations need separate configuration.

## Files to start from

- [`app/`](./app/) — route/page and layout definitions
- [`components/`](./components/) — reusable page, form, and UI components
- [`context/`](./context/) — auth, theme, and workspace context providers
- [`services/`](./services/) — domain API calls and service logic
- [`lib/apiClient.ts`](./lib/apiClient.ts) — base URL, request/auth headers, error handling, and route rewriting
- [`backend/`](./backend/) — Express API, MongoDB persistence, and Firebase token verification
- [`lib/localData.ts`](./lib/localData.ts) — request adapter name notwithstanding, this delegates to the remote API client
- [`types/`](./types/) — shared domain types
- [`package.json`](./package.json) — scripts and dependencies

## Validation performed for this overview

```text
npm run lint       PASS
npm run typecheck  PASS
npm run build      PASS
```

The production build compiled successfully and generated the App Router pages. No unit-test script or test files were found, so interactive behavior and backend connectivity remain unverified.
