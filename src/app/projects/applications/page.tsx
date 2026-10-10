"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ExternalLink, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getProjectApplications, updateProjectApplication } from "@/services/marketplace/marketplaceStore";
import type { ProjectApplication } from "@/types/marketplace";

export default function ProjectApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!user) return;
    let current = true;
    void getProjectApplications("received").then((items) => {
      if (current) setApplications(items);
    }).catch((cause) => {
      if (current) setError(cause instanceof Error ? cause.message : "Applications could not be loaded.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [user]);

  const setStatus = async (application: ProjectApplication, status: "shortlisted" | "accepted" | "rejected") => {
    if (!user) return;
    setBusyId(application.id);
    setError("");
    try {
      const updated = await updateProjectApplication(application.id, status);
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The application could not be updated.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/projects/upload" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowRight aria-hidden="true" className="size-4 rotate-180" />Your opportunities
      </Link>
      <div className="mt-5">
        <p className="text-sm font-medium text-brand">Owner tools</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Applications received</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review people who have expressed interest in your published opportunities.</p>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg border border-brand/25 bg-brand/10 p-3 text-sm">{error}</p>}
      {loading ? (
        <p role="status" className="mt-6 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading applications…</p>
      ) : applications.length ? (
        <ul className="mt-6 space-y-4">
          {applications.map((application) => {
            return (
              <li key={application.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">{application.listingTitle ?? "Project opportunity"}</p>
                    <h2 className="mt-1 text-lg font-semibold">{application.applicantName}</h2>
                    <p className="text-sm text-muted-foreground">{application.applicantProfile?.primaryRole || "ScopeSync member"}{application.applicantProfile?.workTypes.length ? ` · ${application.applicantProfile.workTypes.join(", ")}` : ""}</p>
                  </div>
                  <span className="w-fit rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">{application.status}</span>
                </div>
                <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-[minmax(0,1fr)_15rem]">
                  <div>
                    <h3 className="text-sm font-medium">Application message</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{application.message}</p>
                    <h3 className="mt-4 text-sm font-medium">Relevant experience</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{application.experience || "Not provided."}</p>
                  </div>
                  <dl className="space-y-3 rounded-xl bg-muted/60 p-4 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Proposed budget</dt><dd className="mt-1 font-medium">{application.proposedBudget === null ? "Not provided" : new Intl.NumberFormat(undefined, { style: "currency", currency: application.listingCurrency ?? "INR", maximumFractionDigits: 0 }).format(application.proposedBudget)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Estimated completion</dt><dd className="mt-1 font-medium">{application.estimatedCompletion || "Not provided"}</dd></div>
                  </dl>
                </div>
                {application.status === "pending" || application.status === "shortlisted" ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    {application.status === "pending" && <Button type="button" variant="outline" disabled={busyId === application.id} onClick={() => void setStatus(application, "shortlisted")}><UsersRound aria-hidden="true" />Shortlist</Button>}
                    <Button type="button" disabled={busyId === application.id} onClick={() => void setStatus(application, "accepted")}><Check aria-hidden="true" />{busyId === application.id ? "Updating…" : "Accept and start project"}</Button>
                    <Button type="button" variant="outline" disabled={busyId === application.id} onClick={() => void setStatus(application, "rejected")}><X aria-hidden="true" />Reject</Button>
                    <Button asChild variant="ghost"><Link href={`/projects/find/${application.listingId}`}><ExternalLink aria-hidden="true" />View listing</Link></Button>
                  </div>
                ) : application.status === "accepted" && application.projectId ? (
                  <Button asChild variant="outline" className="mt-4"><Link href={`/projects/${application.projectId}`}>Open shared project workspace<ArrowRight aria-hidden="true" /></Link></Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <section className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <UsersRound aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No applications yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Applications to your published opportunities will appear here.</p>
          <Button asChild variant="outline" className="mt-5"><Link href="/projects/upload">Manage your opportunities</Link></Button>
        </section>
      )}
    </div>
  );
}
