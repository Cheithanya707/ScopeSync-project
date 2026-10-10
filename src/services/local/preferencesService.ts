import { getLocalUserId, requestLocalData } from "@/lib/localData";
import type { UserPreferences } from "@/types/user";

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (getLocalUserId() !== userId) throw new Error("You can only access your own preferences.");
  const values = await requestLocalData<UserPreferences[]>("/api/users/me/preferences");
  return values.find((preferences) => preferences.userId === userId) ?? null;
}

export async function createUserPreferences(data: UserPreferences): Promise<void> {
  await updateUserPreferences(data.userId, data);
}

export async function updateUserPreferences(
  userId: string,
  data: Partial<Omit<UserPreferences, "userId" | "updatedAt">>,
): Promise<void> {
  if (getLocalUserId() !== userId) throw new Error("You can only update your own preferences.");
  const values = await requestLocalData<UserPreferences[]>("/api/users/me/preferences");
  const current = values.find((item) => item.userId === userId);
  const next: UserPreferences = {
    ...current,
    ...data,
    userId,
    updatedAt: new Date().toISOString(),
  };
  await requestLocalData<UserPreferences>("/api/users/me/preferences", {
    method: current ? "PATCH" : "POST",
    body: JSON.stringify(next),
  });
}
