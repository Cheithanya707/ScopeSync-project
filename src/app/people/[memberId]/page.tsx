"use client";

import { useParams } from "next/navigation";
import { MemberProfile } from "@/components/people/MemberProfile";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function PersonDetailsPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const { user } = useAuth();
  const workspace = useWorkspace();
  return <MemberProfile ownerId={user?.uid ?? "local-preview-user"} workspaceId={workspace.workspaceId ?? user?.uid ?? "local-preview-user"} memberId={decodeURIComponent(memberId)} />;
}
