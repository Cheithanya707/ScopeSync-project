"use client";

import { PeopleDirectory } from "@/components/people/PeopleDirectory";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function PeoplePage() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  return <PeopleDirectory ownerId={user?.uid ?? "local-preview-user"} workspaceId={workspace.workspaceId ?? user?.uid ?? "local-preview-user"} />;
}
