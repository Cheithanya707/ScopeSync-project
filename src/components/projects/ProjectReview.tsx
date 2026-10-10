import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/constants";
import type { ProjectFormValues } from "@/types";

function dateLabel(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
}

export function ProjectReview({ values }: { values: ProjectFormValues }) {
  const projectType = PROJECT_TYPES.find((type) => type.value === values.type)?.label ?? "Not selected";
  const status = PROJECT_STATUSES.find((item) => item.value === values.status)?.label ?? "Planning";
  const budget = values.budget
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: values.currency, maximumFractionDigits: 2 }).format(Number(values.budget))
    : "Not set";
  const entries = [
    ["Project type", projectType],
    ["Project name", values.name],
    ["Description", values.description || "Not provided"],
    ["Client / organization", values.clientName || "Not provided"],
    ["Start date", dateLabel(values.startDate)],
    ["Expected deadline", dateLabel(values.deadline)],
    ["Budget", budget],
    ["Status", status],
  ];

  return (
    <dl className="divide-y divide-border rounded-xl border border-border bg-white px-5">
      {entries.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-4 sm:grid-cols-[190px_1fr] sm:gap-5">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-wrap break-words text-sm font-medium text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
