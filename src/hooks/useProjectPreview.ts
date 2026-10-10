"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile } from "@/services/local/userService";
import { getProject } from "@/services/projects/projectStore";
import type { Project } from "@/types";

export function useProjectPreview(projectId: string) {
  const { user } = useAuth();
  const ownerId = user?.uid ?? "local-preview-user";
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    void getUserProfile(ownerId).then((profile) => {
      if (current) setWorkspaceId(profile?.workspaceId ?? null);
    }).catch(() => {
      if (current) setWorkspaceId(null);
    });
    return () => { current = false; };
  }, [ownerId]);

  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => {
      if (current) {
        setLoading(true);
        setError("");
      }
      return getProject(ownerId, workspaceId ?? ownerId, projectId);
    }).then((result) => {
      if (current) setProject(result);
    }).catch(() => {
      if (current) setError("Unable to load this project. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [ownerId, projectId, workspaceId]);

  return { project, loading, error, ownerId, currentUser: user };
}
