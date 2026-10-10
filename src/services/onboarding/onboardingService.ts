import { requestLocalData } from "@/lib/localData";
import type { UserProfile } from "@/types/user";

export type OnboardingData = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  age: number;
  country: string;
  city: string;
  occupation: string;
  workTypes: string[];
  primaryRole?: string;
  goals: string[];
  workspaceName: string;
  workspaceType: string;
  description?: string;
};

export async function completeOnboarding(data: OnboardingData): Promise<{ workspaceId: string; profile: UserProfile }> {
  const existingProfile = await requestLocalData<UserProfile | null>("/api/users/me");

  if (existingProfile?.onboardingCompleted && existingProfile.workspaceId) {
    return {
      workspaceId: existingProfile.workspaceId,
      profile: existingProfile,
    };
  }

  const workspaceId = existingProfile?.workspaceId ?? (await requestLocalData<{ id: string }>("/api/workspaces", {
    method: "POST",
    body: JSON.stringify({
      name: data.workspaceName.trim(),
      type: data.workspaceType,
      description: data.description?.trim() || undefined,
    }),
  })).id;

  const profile: UserProfile = {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName.trim(),
    photoURL: data.photoURL || undefined,
    age: data.age,
    country: data.country.trim(),
    city: data.city.trim(),
    occupation: data.occupation.trim(),
    workTypes: data.workTypes,
    primaryRole: data.primaryRole,
    goals: data.goals,
    onboardingCompleted: true,
    workspaceId,
    createdAt: existingProfile?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const savedProfile = await requestLocalData<UserProfile>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify({
      displayName: profile.displayName,
      ...(profile.photoURL ? { photoURL: profile.photoURL } : {}),
      age: profile.age,
      country: profile.country,
      city: profile.city,
      occupation: profile.occupation,
      workTypes: profile.workTypes,
      ...(profile.primaryRole ? { primaryRole: profile.primaryRole } : {}),
      goals: profile.goals,
      onboardingCompleted: true,
      workspaceId,
    }),
  });

  return { workspaceId, profile: { ...profile, ...savedProfile } };
}
