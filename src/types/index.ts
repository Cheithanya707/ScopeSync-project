export type ProjectUseCase =
  | "Freelance Work"
  | "Agency"
  | "Software Project"
  | "College Event"
  | "School Event"
  | "Hackathon"
  | "Workshop"
  | "Organization"
  | "Other";

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";
export type ProjectKind = "personal" | "freelancer";

export interface ProjectAIPlan {
  summary: string;
  requirements: string[];
  steps: string[];
  openQuestions: string[];
  provider: "gemini" | "rules";
  generatedAt: string;
}

export type ProjectType =
  | "software-development"
  | "web-development"
  | "mobile-app-development"
  | "ui-ux-design"
  | "graphic-design"
  | "video-editing"
  | "photography"
  | "content-writing"
  | "digital-marketing"
  | "social-media"
  | "data-analytics"
  | "college-event"
  | "school-event"
  | "hackathon"
  | "workshop"
  | "conference"
  | "seminar"
  | "organization-event"
  | "organization-project"
  | "other";

export interface Project {
  id: string;
  sourceListingId?: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  description?: string;
  type: ProjectType;
  projectKind?: ProjectKind;
  projectCategory?: string;
  projectSubcategory?: string;
  planningBrief?: string;
  aiPlan?: ProjectAIPlan;
  clientName?: string;
  startDate?: string;
  deadline?: string;
  budget?: number;
  currency: "INR" | "USD" | "EUR" | "GBP";
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormValues {
  name: string;
  description: string;
  type: ProjectType | "";
  clientName: string;
  startDate: string;
  deadline: string;
  budget: string;
  currency: Project["currency"];
  status: ProjectStatus;
}

export type WorkspaceMemberRole =
  | "owner"
  | "admin"
  | "project_manager"
  | "team_member"
  | "designer"
  | "developer"
  | "content_writer"
  | "marketer"
  | "event_manager"
  | "faculty"
  | "student"
  | "other";

export type WorkspaceMemberStatus = "active" | "invited" | "inactive";

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId?: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: WorkspaceMemberRole;
  status: WorkspaceMemberStatus;
  projectIds: string[];
  joinedAt?: string;
  invitedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Requirement {
  id: string;
  code: string;
  workspaceId: string;
  projectId: string;
  ownerId: string;
  title: string;
  status: RequirementStatus;
  description?: string;
  acceptanceCriteria?: string;
  type: RequirementType;
  priority: TaskPriority;
  approved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RequirementStatus = "draft" | "under_review" | "approved" | "rejected" | "archived";
export type RequirementType = "functional" | "non_functional" | "technical" | "design" | "security" | "performance" | "event" | "other";

export interface RequirementFormValues {
  title: string;
  description: string;
  acceptanceCriteria: string;
  type: RequirementType;
  priority: TaskPriority;
  status: RequirementStatus;
}

export type ProjectShareRole = "client" | "stakeholder" | "event_organizer" | "reviewer";
export type ProjectShareStatus = "pending" | "active" | "revoked";

export interface ProjectSharePermissions {
  viewProject: boolean;
  viewRequirements: boolean;
  viewTasks: boolean;
  viewChanges: boolean;
  viewCalendar: boolean;
  viewDocuments: boolean;
  viewPayments: boolean;
  submitChangeRequest: boolean;
  approveChanges?: boolean;
  comment?: boolean;
}

export interface ProjectShare {
  id: string;
  workspaceId: string;
  projectId: string;
  email: string;
  displayName?: string;
  role: ProjectShareRole;
  status: ProjectShareStatus;
  permissions: ProjectSharePermissions;
  accessToken?: string;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastAccessedAt?: unknown;
}

export type EventType =
  | "college_event"
  | "school_event"
  | "hackathon"
  | "workshop"
  | "conference"
  | "seminar"
  | "organization_event"
  | "other";

export interface EventDetails {
  projectId: string;
  workspaceId: string;
  eventType: EventType;
  eventName: string;
  shortDescription?: string;
  venue?: string;
  address?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  registrationRequired: boolean;
  maxParticipants?: number;
  organizerName?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  registrationUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ParticipantRegistrationStatus =
  | "registered"
  | "confirmed"
  | "waitlisted"
  | "cancelled"
  | "attended"
  | "absent";

export type ParticipantPaymentStatus = "not_required" | "pending" | "paid" | "refunded";

export interface EventParticipant {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  email: string;
  phone?: string;
  college?: string;
  organization?: string;
  department?: string;
  year?: string;
  participantType?: string;
  registrationStatus: ParticipantRegistrationStatus;
  teamId?: string;
  paymentStatus?: ParticipantPaymentStatus;
  registrationDate?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type EventTeamStatus = "forming" | "registered" | "confirmed" | "disqualified" | "completed";

export interface EventTeam {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  description?: string;
  leaderParticipantId?: string;
  participantIds: string[];
  status: EventTeamStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type EventScheduleItemType =
  | "registration"
  | "ceremony"
  | "session"
  | "workshop"
  | "competition"
  | "judging"
  | "break"
  | "closing"
  | "other";

export interface EventScheduleItem {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  type: EventScheduleItemType;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type AIInsightType = "scope" | "requirement" | "task" | "deadline" | "change" | "payment" | "general";
export type AIInsightSeverity = "info" | "low" | "medium" | "high" | "critical";
export type HealthStatus = "healthy" | "needs_attention" | "at_risk" | "critical";

export interface AIInsight {
  id: string;
  workspaceId: string;
  projectId?: string;
  type: AIInsightType;
  severity: AIInsightSeverity;
  title: string;
  description: string;
  relatedRequirementIds?: string[];
  relatedTaskIds?: string[];
  relatedChangeIds?: string[];
  recommendation?: string;
  createdAt?: unknown;
}

export interface AIProjectInput {
  project?: Project;
  requirements: Requirement[];
  tasks: Task[];
  scopeChanges: ScopeChange[];
  payments: Payment[];
  members: WorkspaceMember[];
}

export interface AIAnalysisResult {
  insights: AIInsight[];
  summary?: string;
  generatedAt?: string;
}

export interface AIProvider {
  analyzeProject(input: AIProjectInput): Promise<AIAnalysisResult>;
}

export type TaskStatus = "todo" | "in_progress" | "blocked" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskType =
  | "development"
  | "design"
  | "research"
  | "content"
  | "testing"
  | "review"
  | "communication"
  | "documentation"
  | "planning"
  | "marketing"
  | "event"
  | "other";

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string;
  requirementId?: string;
  ownerId: string;
  assigneeId?: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  requirementId: string;
  assigneeId: string;
  dueDate: string;
  estimatedHours: string;
  actualHours: string;
}

export type ChangeType =
  | "new_requirement"
  | "requirement_modification"
  | "requirement_removal"
  | "enhancement"
  | "new_feature"
  | "design_change"
  | "technical_change"
  | "integration_change"
  | "content_change"
  | "deadline_change"
  | "other";

export type ChangeStatus = "new" | "under_review" | "approved" | "rejected" | "implemented" | "cancelled";
export type ChangePriority = TaskPriority;
export type ChangeSource =
  | "client"
  | "freelancer"
  | "team"
  | "organization"
  | "event_organizer"
  | "email"
  | "meeting"
  | "document"
  | "internal"
  | "other";

export interface ScopeChange {
  id: string;
  workspaceId: string;
  projectId: string;
  ownerId: string;
  changeNumber: number;
  title: string;
  description?: string;
  type: ChangeType;
  priority: ChangePriority;
  status: ChangeStatus;
  source: ChangeSource;
  affectedRequirementIds: string[];
  affectedTaskIds: string[];
  requestedDate?: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  implementedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  impact?: { extraHours: number; extraCost: number; scheduleDays: number; note: string; updatedAt?: string; updatedBy?: string };
  clientDecision?: { decision: "approved" | "rejected"; comment: string; name: string; at: string };
  createdAt: string;
  updatedAt: string;
}

export interface ScopeChangeFormValues {
  title: string;
  description: string;
  type: ChangeType;
  priority: ChangePriority;
  source: ChangeSource;
  affectedRequirementIds: string[];
  affectedTaskIds: string[];
  requestedDate: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: CalendarEventType;
  date: string;
  projectId: string;
  projectName: string;
  sourceId: string;
  description?: string;
  status?: string;
  priority?: string;
}

export type CalendarEventType = "project_deadline" | "task_due" | "change_requested" | "payment_due" | "event_schedule";

export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled" | "refunded";
export type PaymentStoredStatus = Exclude<PaymentStatus, "overdue">;
export type PaymentType = "advance" | "milestone" | "final" | "additional_work" | "refund" | "other";
export type PaymentMethod = "cash" | "bank_transfer" | "upi" | "card" | "online" | "other";

export interface Payment {
  id: string;
  workspaceId: string;
  projectId: string;
  ownerId: string;
  paymentNumber: number;
  title: string;
  description?: string;
  type: PaymentType;
  status: PaymentStoredStatus;
  method?: PaymentMethod;
  amount: number;
  currency: Project["currency"];
  dueDate?: string;
  paidDate?: string;
  referenceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentFormValues = Pick<Payment,
  "title" | "description" | "type" | "status" | "method" | "amount" | "currency" | "dueDate" | "paidDate" | "referenceNumber"
>;

export type DocumentFileType =
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "image"
  | "text"
  | "archive"
  | "other";

export interface ProjectDocument {
  id: string;
  workspaceId: string;
  projectId: string;
  ownerId: string;
  name: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileType: DocumentFileType;
  size: number;
  uploadedBy: string;
  description?: string;
  isShared?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActivityEntityType =
  | "workspace"
  | "project"
  | "requirement"
  | "task"
  | "scope_change"
  | "document"
  | "payment"
  | "member"
  | "calendar";

export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "completed"
  | "assigned"
  | "unassigned"
  | "approved"
  | "rejected"
  | "submitted"
  | "uploaded"
  | "paid"
  | "invited"
  | "removed"
  | "status_changed";

export interface Activity {
  id: string;
  workspaceId: string;
  projectId?: string;
  actorId: string;
  actorName: string;
  actorPhotoURL?: string;
  entityType: ActivityEntityType;
  entityId: string;
  entityName: string;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt?: unknown;
}

export type NotificationType =
  | "task_assigned"
  | "task_due"
  | "task_overdue"
  | "scope_change"
  | "requirement_update"
  | "payment_due"
  | "project_update"
  | "document_update"
  | "team_update"
  | "general";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface Notification {
  id: string;
  workspaceId: string;
  userId: string;
  projectId?: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType?: ActivityEntityType;
  entityId?: string;
  actionUrl?: string;
  read: boolean;
  createdAt?: unknown;
  readAt?: unknown;
}
