import type { ProjectSharePermissions } from "@/types";
import type { ClientViewSection } from "@/components/client-view/clientViewTypes";

const sectionInfo: { id: ClientViewSection; label: string; permission: keyof ProjectSharePermissions }[] = [
  { id: "overview", label: "Overview", permission: "viewProject" },
  { id: "requirements", label: "Requirements", permission: "viewRequirements" },
  { id: "tasks", label: "Tasks", permission: "viewTasks" },
  { id: "changes", label: "Changes", permission: "viewChanges" },
  { id: "calendar", label: "Calendar", permission: "viewCalendar" },
  { id: "documents", label: "Documents", permission: "viewDocuments" },
  { id: "payments", label: "Payments", permission: "viewPayments" },
];

export function ClientNavigation({
  permissions,
  active,
  onSelect,
}: {
  permissions: ProjectSharePermissions;
  active: ClientViewSection;
  onSelect: (section: ClientViewSection) => void;
}) {
  const sections = sectionInfo.filter(({ id, permission }) =>
    id === "changes"
      ? permissions.viewChanges || permissions.submitChangeRequest
      : permissions[permission],
  );
  return <nav aria-label="Shared project sections" className="hide-scrollbar -mx-4 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
    <div className="flex min-w-max gap-1">
      {sections.map(({ id, label }) => <button key={id} type="button" aria-current={active === id ? "page" : undefined} onClick={() => onSelect(id)} className={`rounded-t-lg border-b-2 px-3 py-3 text-sm font-medium ${active === id ? "border-brand text-brand" : "border-transparent text-slate-600 hover:text-slate-950"}`}>{label}</button>)}
    </div>
  </nav>;
}
