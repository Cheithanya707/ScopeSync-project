import type { ActivityAction, ActivityEntityType, Project } from "@/types";

const ENTITIES: Array<{ value: ActivityEntityType | "all"; label: string }> = [
  { value: "all", label: "All entities" },
  { value: "project", label: "Projects" },
  { value: "requirement", label: "Requirements" },
  { value: "task", label: "Tasks" },
  { value: "scope_change", label: "Changes" },
  { value: "document", label: "Documents" },
  { value: "payment", label: "Payments" },
  { value: "member", label: "People" },
  { value: "calendar", label: "Calendar" },
];

const ACTIONS: Array<{ value: ActivityAction | "all"; label: string }> = [
  { value: "all", label: "All actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "completed", label: "Completed" },
  { value: "assigned", label: "Assigned" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "uploaded", label: "Uploaded" },
  { value: "paid", label: "Paid" },
];

export function ActivityFilters({
  projects,
  entity,
  action,
  projectId,
  search,
  onEntityChange,
  onActionChange,
  onProjectChange,
  onSearchChange,
}: {
  projects: Project[];
  entity: ActivityEntityType | "all";
  action: ActivityAction | "all";
  projectId: string;
  search: string;
  onEntityChange: (value: ActivityEntityType | "all") => void;
  onActionChange: (value: ActivityAction | "all") => void;
  onProjectChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}) {
  return (
    <section aria-label="Filter activity" className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      <label className="sr-only" htmlFor="activity-search">Search activity</label>
      <input id="activity-search" type="search" placeholder="Search activity..." value={search} onChange={(event) => onSearchChange(event.target.value)} className="h-10 min-w-0 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
      <label className="sr-only" htmlFor="activity-entity">Filter by entity</label>
      <select id="activity-entity" value={entity} onChange={(event) => onEntityChange(event.target.value as ActivityEntityType | "all")} className="h-10 min-w-0 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {ENTITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="activity-action">Filter by action</label>
      <select id="activity-action" value={action} onChange={(event) => onActionChange(event.target.value as ActivityAction | "all")} className="h-10 min-w-0 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {ACTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="activity-project">Filter by project</label>
      <select id="activity-project" value={projectId} onChange={(event) => onProjectChange(event.target.value)} className="h-10 min-w-0 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <option value="all">All projects</option>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
    </section>
  );
}
