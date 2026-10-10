import { requestLocalData } from "@/lib/localData";
import type { Project, WorkspaceMember } from "@/types";
import type { ProjectApplication, ProjectListing } from "@/types/marketplace";

export interface MyProject extends Project {
  memberRole: string;
  teamSize: number;
  progress: number;
}

export function getProjectListings(mine = false): Promise<ProjectListing[]> {
  return requestLocalData<ProjectListing[]>(`/api/marketplace/listings${mine ? "?mine=true" : ""}`);
}

export function getProjectListing(listingId: string): Promise<ProjectListing> {
  return requestLocalData<ProjectListing>(`/api/marketplace/listings/${encodeURIComponent(listingId)}`);
}

export function saveProjectListing(
  input: Omit<ProjectListing, "id" | "ownerId" | "ownerName" | "visibility" | "createdAt" | "updatedAt" | "applicationCount" | "projectId">,
  listingId?: string,
): Promise<ProjectListing> {
  return listingId
    ? requestLocalData<ProjectListing>(`/api/marketplace/listings/${encodeURIComponent(listingId)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      })
    : requestLocalData<ProjectListing>("/api/marketplace/listings", {
        method: "POST",
        body: JSON.stringify(input),
      });
}

export function updateProjectListingStatus(listingId: string, status: "published" | "paused" | "closed"): Promise<ProjectListing> {
  return requestLocalData<ProjectListing>(`/api/marketplace/listings/${encodeURIComponent(listingId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getProjectApplications(scope: "mine" | "received"): Promise<ProjectApplication[]> {
  return requestLocalData<ProjectApplication[]>(`/api/marketplace/applications?scope=${scope}`);
}

export function applyToProjectListing(
  listingId: string,
  input: Pick<ProjectApplication, "message" | "experience" | "proposedBudget" | "estimatedCompletion">,
): Promise<ProjectApplication> {
  return requestLocalData<ProjectApplication>(`/api/marketplace/applications`, {
    method: "POST",
    body: JSON.stringify({ ...input, listingId }),
  });
}

export function updateProjectApplication(
  applicationId: string,
  status: "shortlisted" | "accepted" | "rejected" | "withdrawn",
): Promise<ProjectApplication> {
  return requestLocalData<ProjectApplication>(`/api/marketplace/applications/${encodeURIComponent(applicationId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getMyProjects(): Promise<MyProject[]> {
  return requestLocalData<MyProject[]>("/api/my-projects");
}

export function getProjectTeam(projectId: string): Promise<WorkspaceMember[]> {
  return requestLocalData<WorkspaceMember[]>(`/api/projects/${encodeURIComponent(projectId)}/members`);
}
