import type {
  EventScheduleItemType,
  EventTeamStatus,
  EventType,
  ParticipantPaymentStatus,
  ParticipantRegistrationStatus,
} from "@/types";

export const EVENT_TYPES: { value: EventType; label: string; projectTypes: string[] }[] = [
  { value: "college_event", label: "College Event", projectTypes: ["college-event"] },
  { value: "school_event", label: "School Event", projectTypes: ["school-event"] },
  { value: "hackathon", label: "Hackathon", projectTypes: ["hackathon"] },
  { value: "workshop", label: "Workshop", projectTypes: ["workshop"] },
  { value: "conference", label: "Conference", projectTypes: ["conference"] },
  { value: "seminar", label: "Seminar", projectTypes: ["seminar"] },
  { value: "organization_event", label: "Organization Event", projectTypes: ["organization-event", "organization-project"] },
  { value: "other", label: "Other", projectTypes: [] },
];

export const EVENT_PROJECT_TYPES = new Set(EVENT_TYPES.flatMap((event) => event.projectTypes));

export const REGISTRATION_STATUSES: { value: ParticipantRegistrationStatus; label: string }[] = [
  { value: "registered", label: "Registered" },
  { value: "confirmed", label: "Confirmed" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "cancelled", label: "Cancelled" },
  { value: "attended", label: "Attended" },
  { value: "absent", label: "Absent" },
];

export const PARTICIPANT_PAYMENT_STATUSES: { value: ParticipantPaymentStatus; label: string }[] = [
  { value: "not_required", label: "Not required" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

export const EVENT_TEAM_STATUSES: { value: EventTeamStatus; label: string }[] = [
  { value: "forming", label: "Forming" },
  { value: "registered", label: "Registered" },
  { value: "confirmed", label: "Confirmed" },
  { value: "disqualified", label: "Disqualified" },
  { value: "completed", label: "Completed" },
];

export const SCHEDULE_ITEM_TYPES: { value: EventScheduleItemType; label: string }[] = [
  { value: "registration", label: "Registration" },
  { value: "ceremony", label: "Ceremony" },
  { value: "session", label: "Session" },
  { value: "workshop", label: "Workshop" },
  { value: "competition", label: "Competition" },
  { value: "judging", label: "Judging" },
  { value: "break", label: "Break" },
  { value: "closing", label: "Closing" },
  { value: "other", label: "Other" },
];
