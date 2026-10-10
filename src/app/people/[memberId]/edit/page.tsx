"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberForm } from "@/components/people/MemberForm";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getWorkspaceMember, updateWorkspaceMember } from "@/services/people/memberStore";
import type { WorkspaceMember } from "@/types";

export default function EditPersonPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const workspace = useWorkspace();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [member, setMember] = useState<WorkspaceMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!workspace.workspaceId) return;
    let current = true;
    void getWorkspaceMember(ownerId, activeWorkspaceId, decodeURIComponent(memberId)).then((result) => {
      if (current) setMember(result);
    }).catch(() => {
      if (current) setError("Unable to load this person. Please try again.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, memberId, ownerId, workspace.workspaceId]);

  const currentMember = workspace.workspaceId ? member : null;
  if (workspace.workspaceId && loading) return <div role="status" className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading person…</div>;
  if (!currentMember) return <section className="rounded-xl border border-border bg-white p-8 text-center"><h1 className="text-xl font-semibold text-slate-950">Person unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{workspace.workspaceId ? error || "This person is not available in the current workspace." : "Complete workspace setup before editing a person."}</p><Button asChild variant="outline" className="mt-5"><Link href="/people">Back to people</Link></Button></section>;

  return <div className="mx-auto max-w-3xl">
    <Link href={`/people/${encodeURIComponent(currentMember.id)}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />Back to profile</Link>
    <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">Edit Person</h1>
    <p className="mt-2 text-sm text-muted-foreground">Update {currentMember.displayName}&apos;s workspace details.</p>
    <MemberForm member={currentMember} cancelHref={`/people/${encodeURIComponent(currentMember.id)}`} onSubmit={async (values) => {
      if (!("displayName" in values)) return;
      const updated = await updateWorkspaceMember(ownerId, activeWorkspaceId, currentMember.id, values);
      router.push(`/people/${encodeURIComponent(updated.id)}`);
    }} />
  </div>;
}
