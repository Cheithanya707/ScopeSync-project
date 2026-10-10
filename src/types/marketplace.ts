import type { ProjectType } from "@/types";

export type ListingStatus = "draft" | "published" | "paused" | "closed" | "filled" | "cancelled";
export type ApplicationStatus = "pending" | "shortlisted" | "accepted" | "rejected" | "withdrawn";

export interface ProjectListing {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  projectType: ProjectType;
  category: string;
  requiredSkills: string[];
  budget: number | null;
  currency: "INR" | "USD" | "EUR" | "GBP";
  deadline: string;
  location: string;
  remote: boolean;
  experienceLevel: string;
  maxCollaborators: number;
  visibility: "public";
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  applicationCount: number;
  projectId?: string;
}

export interface ProjectApplication {
  id: string;
  listingId: string;
  applicantId: string;
  applicantName: string;
  applicantProfile?: {
    primaryRole?: string;
    workTypes: string[];
  };
  ownerId: string;
  message: string;
  experience: string;
  proposedBudget: number | null;
  estimatedCompletion: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  listingTitle?: string;
  listingCategory?: string;
  listingCurrency?: ProjectListing["currency"];
}

export interface MarketplaceProjectMember {
  id: string;
  projectId: string;
  workspaceId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  role: "owner" | "manager" | "developer" | "designer" | "editor" | "contributor" | "reviewer" | "client";
  status: "active" | "removed";
  joinedAt: string;
}
