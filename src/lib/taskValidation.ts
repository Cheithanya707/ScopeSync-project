import type { TaskFormValues } from "@/types";

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>;

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};
  const title = values.title.trim();
  if (title.length < 3) errors.title = "Task title must be at least 3 characters.";
  else if (title.length > 150) errors.title = "Task title must be 150 characters or fewer.";
  if (values.description.length > 3000) errors.description = "Description must be 3000 characters or fewer.";
  if (values.dueDate && !validDate(values.dueDate)) errors.dueDate = "Enter a valid due date.";
  if (values.estimatedHours && (!Number.isFinite(Number(values.estimatedHours)) || Number(values.estimatedHours) <= 0)) errors.estimatedHours = "Enter a positive number of hours.";
  if (values.actualHours && (!Number.isFinite(Number(values.actualHours)) || Number(values.actualHours) <= 0)) errors.actualHours = "Enter a positive number of hours.";
  return errors;
}
