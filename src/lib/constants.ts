export const APP_NAME = "ScopeSync";

export const PROJECT_USE_CASES = [
  "Freelance Work",
  "Agency",
  "Software Project",
  "College Event",
  "School Event",
  "Hackathon",
  "Workshop",
  "Organization",
  "Other",
] as const;

export const WORK_TYPE_OPTIONS = [
  "Freelance Projects",
  "Agency Work",
  "Software Development",
  "Web Development",
  "Graphic Design",
  "UI/UX Design",
  "Video Editing",
  "Photography",
  "Content Writing",
  "Digital Marketing",
  "Social Media",
  "Data / Analytics",
  "College Events",
  "School Events",
  "Hackathons",
  "Workshops",
  "Conferences",
  "Organization Projects",
  "Other",
] as const;

export const ROLE_OPTIONS = [
  "Freelancer",
  "Founder",
  "Agency Owner",
  "Project Manager",
  "Event Organizer",
  "Team Member",
  "Student",
  "Teacher / Faculty",
  "Business Owner",
  "Other",
] as const;

export const GOAL_OPTIONS = [
  "Manage Projects",
  "Track Requirements",
  "Manage Tasks",
  "Prevent Scope Creep",
  "Track Client Changes",
  "Manage Events",
  "Track Deadlines",
  "Track Payments",
  "Manage Team Members",
  "Monitor Project Progress",
  "Understand Project Risks",
  "Analyze Changes with AI",
  "Keep Project History",
] as const;

export const WORKSPACE_TYPE_OPTIONS = [
  "Personal",
  "Freelancer",
  "Agency",
  "College",
  "School",
  "Organization",
  "Team",
  "Other",
] as const;

export type ProjectUseCaseValue = (typeof PROJECT_USE_CASES)[number];
export type WorkTypeValue = (typeof WORK_TYPE_OPTIONS)[number];
export type RoleValue = (typeof ROLE_OPTIONS)[number];
export type GoalValue = (typeof GOAL_OPTIONS)[number];
export type WorkspaceTypeValue = (typeof WORKSPACE_TYPE_OPTIONS)[number];

export const PROJECT_TYPES = [
  { value: "software-development", label: "Software Development", description: "Build and manage a software project.", icon: "code" },
  { value: "web-development", label: "Web Development", description: "Plan a website and its delivery.", icon: "globe" },
  { value: "mobile-app-development", label: "Mobile App Development", description: "Organize a mobile application project.", icon: "smartphone" },
  { value: "ui-ux-design", label: "UI/UX Design", description: "Manage design work and client requirements.", icon: "pen-tool" },
  { value: "graphic-design", label: "Graphic Design", description: "Keep creative assets and design work organized.", icon: "palette" },
  { value: "video-editing", label: "Video Editing", description: "Coordinate video production and editing work.", icon: "video" },
  { value: "photography", label: "Photography", description: "Plan shoots, deliverables, and deadlines.", icon: "camera" },
  { value: "content-writing", label: "Content Writing", description: "Manage content projects from brief to delivery.", icon: "file-text" },
  { value: "digital-marketing", label: "Digital Marketing", description: "Organize campaigns and marketing work.", icon: "megaphone" },
  { value: "social-media", label: "Social Media", description: "Plan social media work and publishing goals.", icon: "share-2" },
  { value: "data-analytics", label: "Data / Analytics", description: "Manage analytics and data initiatives.", icon: "chart-no-axes-column-increasing" },
  { value: "college-event", label: "College Event", description: "Coordinate college events and deadlines.", icon: "graduation-cap" },
  { value: "school-event", label: "School Event", description: "Organize school events and activities.", icon: "school" },
  { value: "hackathon", label: "Hackathon", description: "Manage a hackathon project or event.", icon: "lightbulb" },
  { value: "workshop", label: "Workshop", description: "Plan workshop content and logistics.", icon: "presentation" },
  { value: "conference", label: "Conference", description: "Coordinate conference planning work.", icon: "users" },
  { value: "seminar", label: "Seminar", description: "Coordinate a seminar and its schedule.", icon: "presentation" },
  { value: "organization-event", label: "Organization Event", description: "Plan an event for your organization.", icon: "building-2" },
  { value: "organization-project", label: "Organization Project", description: "Keep organization work on track.", icon: "building-2" },
  { value: "other", label: "Other", description: "Set up a project for any other kind of work.", icon: "folder-kanban" },
] as const;

export const PERSONAL_EVENT_PROJECT_TYPES = new Set<string>([
  "college-event",
  "school-event",
  "hackathon",
  "workshop",
  "conference",
  "seminar",
  "organization-event",
]);

export const FREELANCER_PROJECT_TYPES = PROJECT_TYPES.filter(
  (projectType) => !PERSONAL_EVENT_PROJECT_TYPES.has(projectType.value),
);

export const PROJECT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
] as const;

export const PROJECT_CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
