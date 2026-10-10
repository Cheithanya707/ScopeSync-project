import type { ChangePriority, ChangeSource, ChangeStatus, ChangeType } from "@/types";

export const CHANGE_TYPES: { value: ChangeType; label: string }[] = [
  { value: "new_requirement", label: "New Requirement" },
  { value: "requirement_modification", label: "Requirement Modification" },
  { value: "requirement_removal", label: "Requirement Removal" },
  { value: "enhancement", label: "Enhancement" },
  { value: "new_feature", label: "New Feature" },
  { value: "design_change", label: "Design Change" },
  { value: "technical_change", label: "Technical Change" },
  { value: "integration_change", label: "Integration Change" },
  { value: "content_change", label: "Content Change" },
  { value: "deadline_change", label: "Deadline Change" },
  { value: "other", label: "Other" },
];

export const CHANGE_STATUSES: { value: ChangeStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "implemented", label: "Implemented" },
  { value: "cancelled", label: "Cancelled" },
];

export const CHANGE_PRIORITIES: { value: ChangePriority; label: string; rank: number }[] = [
  { value: "low", label: "Low", rank: 1 },
  { value: "medium", label: "Medium", rank: 2 },
  { value: "high", label: "High", rank: 3 },
  { value: "critical", label: "Critical", rank: 4 },
];

export const CHANGE_SOURCES: { value: ChangeSource; label: string }[] = [
  { value: "client", label: "Client" },
  { value: "freelancer", label: "Freelancer" },
  { value: "team", label: "Team" },
  { value: "organization", label: "Organization" },
  { value: "event_organizer", label: "Event Organizer" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "document", label: "Document" },
  { value: "internal", label: "Internal" },
  { value: "other", label: "Other" },
];
