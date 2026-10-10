"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ClientCalendar } from "@/components/client-view/ClientCalendar";
import { ClientChanges } from "@/components/client-view/ClientChanges";
import { ClientDocuments } from "@/components/client-view/ClientDocuments";
import { ClientLayout } from "@/components/client-view/ClientLayout";
import { ClientPayments } from "@/components/client-view/ClientPayments";
import { ClientProjectOverview } from "@/components/client-view/ClientProjectOverview";
import { Logo } from "@/src/ui/brand/Logo";
import { ClientRequirements } from "@/components/client-view/ClientRequirements";
import { ClientTasks } from "@/components/client-view/ClientTasks";
import type { ClientViewSection } from "@/components/client-view/clientViewTypes";
import { downloadSharedDocument, loadClientShare, submitClientChangeRequest, type ClientShareSnapshot } from "@/services/client-view/clientShareData";
import { decideSharedChange } from "@/services/scope/scopeService";
import { ShareAccessError } from "@/services/local/projectShareService";
import type { TaskPriority } from "@/types";

function LoadingView() {
  return <div className="mx-auto max-w-5xl animate-pulse px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading shared project">
    <div className="h-8 w-40 rounded bg-slate-200" /><div className="mt-4 h-10 max-w-lg rounded bg-slate-200" />
    <div className="mt-6 flex gap-2 overflow-hidden">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-9 w-28 shrink-0 rounded bg-slate-200" />)}</div>
    <div className="mt-6 h-52 rounded-xl bg-slate-200" /><div className="mt-4 h-40 rounded-xl bg-slate-200" />
    <p className="sr-only">Loading shared project information…</p>
  </div>;
}

export function ClientProjectView({ shareToken }: { shareToken: string }) {
  const [snapshot, setSnapshot] = useState<ClientShareSnapshot | null>(null);
  const [section, setSection] = useState<ClientViewSection>("overview");
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<"invalid" | "revoked" | "inactive" | "permission" | "unavailable" | "">("");
  const [documentBusy, setDocumentBusy] = useState("");
  const [documentError, setDocumentError] = useState("");

  useEffect(() => {
    let active = true;
    void loadClientShare(shareToken).then((data) => {
      if (active) {
        setSnapshot(data);
        if (!data) setErrorCode("invalid");
        else {
          const { permissions } = data.share;
          const firstAllowed: ClientViewSection = permissions.viewProject ? "overview"
            : permissions.viewRequirements ? "requirements"
              : permissions.viewTasks ? "tasks"
                : permissions.viewChanges || permissions.submitChangeRequest ? "changes"
                  : permissions.viewCalendar ? "calendar"
                    : permissions.viewDocuments ? "documents"
                      : "payments";
          setSection(firstAllowed);
        }
      }
    }).catch((caught: unknown) => {
      if (!active) return;
      setErrorCode(caught instanceof ShareAccessError
        ? caught.code === "secure_endpoint_unavailable" ? "unavailable" : caught.code
        : "unavailable");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [shareToken]);

  const showDocument = async (id: string, action: "open" | "download") => {
    setDocumentBusy(id);
    setDocumentError("");
    let opened: Window | null = null;
    if (action === "open") {
      opened = window.open("about:blank", "_blank");
      if (opened) opened.opener = null;
    }
    try {
      const result = await downloadSharedDocument(shareToken, id);
      const url = URL.createObjectURL(new Blob([result.file], { type: result.mimeType }));
      if (action === "open") {
        if (!opened) throw new Error("Your browser blocked the document tab. Allow pop-ups and try again.");
        opened.location.replace(url);
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        const anchor = window.document.createElement("a");
        anchor.href = url;
        anchor.download = result.name;
        window.document.body.append(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } catch (caught) {
      opened?.close();
      setDocumentError(caught instanceof Error ? caught.message : "The shared document could not be opened.");
    } finally {
      setDocumentBusy("");
    }
  };

  const submitRequest = async (data: { title: string; description: string; priority: TaskPriority }) => {
    await submitClientChangeRequest(shareToken, data);
    const latest = await loadClientShare(shareToken);
    if (latest) setSnapshot(latest);
  };

  const decideChange = async (changeId: string, decision: "approved" | "rejected", comment: string) => {
    await decideSharedChange(shareToken, changeId, { decision, comment });
    const latest = await loadClientShare(shareToken);
    if (latest) setSnapshot(latest);
  };

  if (loading) return <LoadingView />;
  if (!snapshot || errorCode) {
    const content = {
      invalid: ["Link Not Found", "This shared project link is invalid or no longer available."],
      revoked: ["Access Revoked", "This project share is no longer active."],
      inactive: ["Access Not Active", "This project share has not been activated."],
      permission: ["Access Not Available", "You do not have permission to view this section."],
      unavailable: ["Secure Access Not Ready", "Public project links are disabled until a trusted server-side share service is configured."],
      "": ["Link Not Found", "This shared project link is invalid or no longer available."],
    }[errorCode];
    return <main className="min-h-screen bg-slate-50 px-4 py-16"><div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm"><Logo className="mx-auto" href="/" size="md" /><ShieldCheck aria-hidden="true" className="mx-auto mt-5 size-9 text-brand" /><h1 className="mt-5 text-2xl font-semibold text-slate-950">{content[0]}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{content[1]}</p></div></main>;
  }

  const { share, project } = snapshot;
  const progress = share.permissions.viewTasks && snapshot.tasks.length > 0
    ? Math.round(snapshot.tasks.filter((task) => task.status === "completed").length / snapshot.tasks.length * 100)
    : null;

  return <ClientLayout projectName={share.permissions.viewProject ? project.name : "Shared project"} permissions={share.permissions} active={section} onSelect={setSection}>
    {section === "overview" && share.permissions.viewProject && <ClientProjectOverview project={project} eventDetails={snapshot.eventDetails} progress={progress} />}
    {section === "requirements" && share.permissions.viewRequirements && <div className="mt-6"><ClientRequirements requirements={snapshot.requirements} /></div>}
    {section === "tasks" && share.permissions.viewTasks && <div className="mt-6"><ClientTasks tasks={snapshot.tasks} /></div>}
    {section === "changes" && (share.permissions.viewChanges || share.permissions.submitChangeRequest) && <ClientChanges changes={snapshot.changes} canViewChanges={share.permissions.viewChanges} canSubmitRequest={share.permissions.submitChangeRequest} canApprove={share.permissions.viewChanges && share.permissions.approveChanges === true} onSubmitRequest={submitRequest} onDecide={decideChange} />}
    {section === "calendar" && share.permissions.viewCalendar && <div className="mt-6"><ClientCalendar dates={snapshot.calendar} /></div>}
    {section === "documents" && share.permissions.viewDocuments && <div className="mt-6"><ClientDocuments documents={snapshot.documents} busyId={documentBusy} error={documentError} onOpen={(id) => void showDocument(id, "open")} onDownload={(id) => void showDocument(id, "download")} /></div>}
    {section === "payments" && share.permissions.viewPayments && <div className="mt-6"><ClientPayments payments={snapshot.payments} /></div>}
  </ClientLayout>;
}
