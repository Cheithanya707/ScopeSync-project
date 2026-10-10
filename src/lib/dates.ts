export function parseDateOnly(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDateOnly(value: string, options: Intl.DateTimeFormatOptions = { dateStyle: "medium" }): string {
  const date = parseDateOnly(value);
  return date ? new Intl.DateTimeFormat(undefined, options).format(date) : "Not set";
}

export function formatDateTime(value?: string): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function isDateBeforeToday(value: string): boolean {
  return value < localDateKey();
}

export function relativeDateLabel(value?: string): { label: string; overdue: boolean } {
  if (!value) return { label: "No date", overdue: false };
  const date = parseDateOnly(value);
  if (!date) return { label: "Not set", overdue: false };
  const key = localDateKey(date);
  const today = localDateKey();
  if (key < today) return { label: `Due ${formatDateOnly(value, { day: "numeric", month: "short" })}`, overdue: true };
  if (key === today) return { label: "Today", overdue: false };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === localDateKey(tomorrow)) return { label: "Tomorrow", overdue: false };
  return { label: formatDateOnly(value, { day: "numeric", month: "short" }), overdue: false };
}

export function deadlineDateLabel(value?: string): string {
  const relative = relativeDateLabel(value);
  if (relative.overdue) return "Overdue";
  return relative.label === "Today" || relative.label === "Tomorrow" ? `Due ${relative.label}` : value ? `Due ${relative.label}` : "No deadline";
}
