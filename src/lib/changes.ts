import { CHANGE_PRIORITIES, CHANGE_SOURCES, CHANGE_STATUSES, CHANGE_TYPES } from "@/lib/constants/changes";
import type { ScopeChange } from "@/types";

export function changeCode(change: ScopeChange) {
  return `CHANGE-${String(change.changeNumber).padStart(3, "0")}`;
}

export function changeLabel<T extends string>(
  values: readonly { value: T; label: string }[],
  value: T,
) {
  return values.find((item) => item.value === value)?.label ?? value;
}

export function changeDate(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? "Not set" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export { CHANGE_PRIORITIES, CHANGE_SOURCES, CHANGE_STATUSES, CHANGE_TYPES };
