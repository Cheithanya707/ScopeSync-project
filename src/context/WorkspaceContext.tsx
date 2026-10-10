"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { addActivityEventListener } from "@/lib/activityEvents";
import { getIsLocalDemoMode, isLocalDataAvailable } from "@/lib/localData";
import { createActivity } from "@/services/local/activityService";
import { createNotification } from "@/services/local/notificationService";
import { getUserProfile } from "@/services/local/userService";
import { getWorkspace } from "@/services/local/workspaceService";
import { getWorkspaceMembers } from "@/services/people/memberStore";
import type { UserProfile } from "@/types/user";
import type { Workspace } from "@/types/workspace";

interface WorkspaceContextValue {
  workspaceId: string | null;
  profile: UserProfile | null;
  workspace: Workspace | null;
  loading: boolean;
  error: string;
  activityError: string;
  clearActivityError: () => void;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useActiveWorkspace(): string | null {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useActiveWorkspace must be used inside WorkspaceProvider");
  return context.workspaceId;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activityError, setActivityError] = useState("");

  const refresh = useCallback(async () => {
    if (!isLocalDataAvailable && getIsLocalDemoMode()) {
      setProfile(null);
      setWorkspace(null);
      setLoadedUserId(user?.uid ?? null);
      setIsRefreshing(false);
      setError("");
      return;
    }
    if (!user) {
      setProfile(null);
      setWorkspace(null);
      setLoadedUserId(null);
      setIsRefreshing(false);
      setError("");
      return;
    }
    setIsRefreshing(true);
    setError("");
    try {
      const current = await getUserProfile(user.uid);
      setProfile(current);
      const currentWorkspace = current?.workspaceId ? await getWorkspace(current.workspaceId) : null;
      setWorkspace(currentWorkspace);
      if (!current?.workspaceId) setError("Complete workspace setup to use activity and notifications.");
      else if (!currentWorkspace) setError("Your workspace could not be found. Contact your workspace owner.");
    } catch (cause) {
      setError(cause instanceof Error && cause.message
        ? cause.message
        : "Your workspace could not be loaded. Please try again.");
    } finally {
      setLoadedUserId(user.uid);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    return addActivityEventListener(async (event) => {
      if (event.ownerId !== user.uid) return;
      if (!profile?.workspaceId) {
        setActivityError("Your change was saved, but activity history requires a completed workspace setup.");
        return;
      }
      try {
        await createActivity({
          workspaceId: profile.workspaceId,
          projectId: event.projectId,
          actorId: user.uid,
          actorName: profile.displayName || user.displayName || "Workspace member",
          actorPhotoURL: profile.photoURL || user.photoURL || undefined,
          entityType: event.entityType,
          entityId: event.entityId,
          entityName: event.entityName,
          action: event.action,
          description: event.description,
          metadata: event.metadata,
        });
      } catch {
        setActivityError("Your change was saved, but its activity could not be saved to the backend.");
        return;
      }

      if (event.action !== "assigned" || event.entityType !== "task" || !event.assigneeId) return;
      try {
        const member = await getWorkspaceMembers(user.uid, profile.workspaceId).then((members) =>
          members.find((item) => item.id === event.assigneeId || item.userId === event.assigneeId),
        );
        const recipientId = member?.userId ?? (event.assigneeId === user.uid ? user.uid : undefined);
        if (!recipientId) return;
        await createNotification({
          workspaceId: profile.workspaceId,
          userId: recipientId,
          projectId: event.projectId,
          type: "task_assigned",
          priority: "normal",
          title: "You were assigned a task",
          message: `"${event.entityName}" has been assigned to you.`,
          entityType: "task",
          entityId: event.entityId,
          actionUrl: event.projectId
            ? `/projects/${encodeURIComponent(event.projectId)}/tasks/${encodeURIComponent(event.entityId)}`
            : undefined,
        });
      } catch {
        setActivityError("The task activity was saved, but its assignee notification could not be created.");
      }
    });
  }, [profile, user]);

  const clearActivityError = useCallback(() => setActivityError(""), []);
  const loading = authLoading || Boolean(
    user && (isRefreshing || loadedUserId !== user.uid),
  );
  const value = useMemo<WorkspaceContextValue>(() => ({
    workspaceId: profile?.workspaceId ?? null,
    profile,
    workspace,
    loading,
    error,
    activityError,
    clearActivityError,
    refresh,
  }), [profile, workspace, loading, error, activityError, clearActivityError, refresh]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
