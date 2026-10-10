export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  workTypes: string[];
  primaryRole?: string;
  teamSize?: string;
  age?: number;
  country?: string;
  city?: string;
  occupation?: string;
  goals: string[];
  onboardingCompleted: boolean;
  workspaceId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPreferences {
  userId: string;
  defaultProjectId?: string;
  defaultCalendarView?: "month" | "week" | "day";
  defaultTaskView?: "list" | "board";
  compactMode?: boolean;
  updatedAt?: unknown;
}
