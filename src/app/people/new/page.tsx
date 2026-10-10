"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MemberForm } from "@/components/people/MemberForm";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { createWorkspaceMember } from "@/services/people/memberStore";

export default function NewPersonPage() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const router = useRouter();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  return <div className="mx-auto max-w-3xl">
    <Link href="/people" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />Back to people</Link>
    <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Add Person</h1>
    <p className="mt-2 text-sm text-muted-foreground">Add a person to your workspace and include them in projects.</p>
    <MemberForm currentUser={{ uid: user?.uid, email: user?.email }} cancelHref="/people" onSubmit={async (values) => {
      if (!("email" in values)) return;
      const member = await createWorkspaceMember(ownerId, activeWorkspaceId, values);
      router.push(`/people/${encodeURIComponent(member.id)}`);
    }} />
  </div>;
}
