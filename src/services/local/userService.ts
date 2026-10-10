import { getLocalUserId, requestLocalData } from "@/lib/localData";
import type { LocalUser } from "@/lib/auth";
import type { UserProfile } from "@/types/user";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (getLocalUserId() !== uid) throw new Error("You can only access your own profile.");
  return requestLocalData<UserProfile | null>("/api/users/me");
}

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  if (getLocalUserId() !== profile.uid) throw new Error("You can only update your own profile.");
  await requestLocalData<UserProfile>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}

export async function upsertAuthUserProfile(user: LocalUser): Promise<void> {
  if (getLocalUserId() !== user.uid) throw new Error("You can only synchronize your own profile.");
  const existing = await getUserProfile(user.uid);
  const now = new Date().toISOString();
  await upsertUserProfile({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName?.trim() || existing?.displayName || user.email.split("@")[0],
    ...(user.photoURL || existing?.photoURL ? { photoURL: user.photoURL ?? existing?.photoURL } : {}),
    workTypes: existing?.workTypes ?? [],
    goals: existing?.goals ?? [],
    onboardingCompleted: existing?.onboardingCompleted ?? false,
    ...(existing?.workspaceId ? { workspaceId: existing.workspaceId } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; photoURL?: string | null; primaryRole?: string; teamSize?: string; workTypes?: string[] },
): Promise<void> {
  if (getLocalUserId() !== uid) throw new Error("You can only update your own profile.");
  const updates = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
  await requestLocalData<UserProfile>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function uploadProfilePhoto(file: File, uid: string): Promise<string> {
  if (getLocalUserId() !== uid) throw new Error("You can only update your own profile.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("Choose an image no larger than 5 MB.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("The selected photo could not be read."));
    reader.onerror = () => reject(new Error("The selected photo could not be read."));
    reader.readAsDataURL(file);
  });
  await updateUserProfile(uid, { photoURL: dataUrl });
  return dataUrl;
}

export async function deleteProfilePhoto(uid: string): Promise<void> {
  await updateUserProfile(uid, { photoURL: null });
}
