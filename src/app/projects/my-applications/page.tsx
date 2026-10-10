"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getProjectApplications, updateProjectApplication } from "@/services/marketplace/marketplaceStore";
import type { ProjectApplication } from "@/types/marketplace";

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ProjectApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!user) return;
    let current = true;
    void getProjectApplications("mine").then((applications) => {
      if (current) setItems(applications);
    }).catch((cause) => {
      if (current) setError(cause instanceof Error ? cause.message : "Your applications could not be loaded.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [user]);

  const withdraw = async (application: ProjectApplication) => {
    setBusyId(application.id);
    setError("");
    try {
      const updated = await updateProjectApplication(application.id, "withdrawn");
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The application could not be withdrawn.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/projects/find" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />Find Projects
      </Link>
      <div className="mt-5">
        <p className="text-sm font-medium text-brand">Marketplace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">My Applications</h1>
        <p className="mt-2 text-sm text-muted-foreground">Follow opportunities you have applied to.</p>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg border border-brand/25 bg-brand/10 p-3 text-sm">{error}</p>}
      {loading ? (
        <p role="status" className="mt-6 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading your applications…</p>
      ) : items.length ? (
        <ul className="mt-6 space-y-3">
          {items.map((application) => (
            <li key={application.id} className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">{application.listingTitle ?? "Project opportunity"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{application.listingCategory || "Opportunity"} · {application.estimatedCompletion || "Timeline not specified"}</p>
                <span className="mt-2 inline-flex rounded-full border border-border px-2.5 py-1 text-xs capitalize">{application.status}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {application.status === "accepted" && application.projectId ? (
                  <Button asChild><Link href={`/projects/${application.projectId}`}>Open shared workspace<ArrowRight aria-hidden="true" /></Link></Button>
                ) : <Button asChild variant="outline"><Link href={`/projects/find/${application.listingId}`}>View opportunity</Link></Button>}
                {["pending", "shortlisted"].includes(application.status) && <Button type="button" variant="outline" disabled={busyId === application.id} onClick={() => void withdraw(application)}>{busyId === application.id ? "Withdrawing…" : "Withdraw"}</Button>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <section className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <h2 className="font-semibold">No applications yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">When you apply to a public opportunity, it will show up here.</p>
          <Button asChild className="mt-5"><Link href="/projects/find">Browse opportunities</Link></Button>
        </section>
      )}
    </div>
  );
}
