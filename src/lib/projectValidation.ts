import { PROJECT_TYPES } from "@/lib/constants";
import type { ProjectFormValues, ProjectType } from "@/types";

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>;

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateProjectForm(values: ProjectFormValues, requireType = true): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = "Project name is required.";
  else if (name.length < 3) errors.name = "Project name must be at least 3 characters.";
  else if (name.length > 100) errors.name = "Project name must be 100 characters or fewer.";
  if (values.description.length > 3000) errors.description = "Description must be 3000 characters or fewer.";
  if (values.clientName.trim().length > 150) errors.clientName = "Client name must be 150 characters or fewer.";
  if (requireType && !PROJECT_TYPES.some((type) => type.value === values.type)) errors.type = "Choose a project type.";
  if (values.budget && (!Number.isFinite(Number(values.budget)) || Number(values.budget) <= 0)) {
    errors.budget = "Enter a valid positive budget.";
  }
  if (values.startDate && !isValidDate(values.startDate)) errors.startDate = "Enter a valid start date.";
  if (values.deadline && !isValidDate(values.deadline)) errors.deadline = "Enter a valid deadline.";
  if (
    values.startDate &&
    values.deadline &&
    isValidDate(values.startDate) &&
    isValidDate(values.deadline) &&
    values.deadline < values.startDate
  ) {
    errors.deadline = "Deadline cannot be before the start date.";
  }
  return errors;
}

export function normalizeProjectType(value: string): ProjectType {
  return PROJECT_TYPES.find((item) => item.value === value)?.value ?? "other";
}
