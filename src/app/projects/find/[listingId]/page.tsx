"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, CircleDollarSign, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROJECT_TYPES } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { applyToProjectListing, getProjectApplications, getProjectListing } from "@/services/marketplace/marketplaceStore";
import type { ProjectApplication, ProjectListing } from "@/types/marketplace";

export default function ProjectListingPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const { user } = useAuth();
  const [listing, setListing] = useState<ProjectListing | null>(null);
  const [application, setApplication] = useState<ProjectApplication | null>(null);
  const [message, setMessage] = useState("");
  const [experience, setExperience] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let current = true;
    void Promise.all([getProjectListing(listingId), getProjectApplications("mine")]).then(([currentListing, applications]) => {
      if (!current) return;
      setListing(currentListing);
      setApplication(applications.find((item) => item.listingId === listingId) ?? null);
    }).catch((cause) => {
      if (current) setError(cause instanceof Error ? cause.message : "The opportunity could not be loaded.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [listingId, user]);

  const isOwner = Boolean(user && listing?.ownerId === user.uid);
  const visibleToCurrentUser = Boolean(listing && (listing.status === "published" || isOwner || application));

  const handleApply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !listing) return;
    setSubmitting(true);
    setError("");
    try {
      const created = await applyToProjectListing(listing.id, {
        message: message.trim(),
        experience: experience.trim(),
        proposedBudget: proposedBudget ? Number(proposedBudget) : null,
        estimatedCompletion: estimatedCompletion.trim(),
      });
      setApplication(created);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your application could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div role="status" className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading opportunity…</div>;
  }
  if (!listing || !visibleToCurrentUser) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">Opportunity unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error || "This listing may have been removed, closed, or is not published."}</p>
        <Button asChild variant="outline" className="mt-5"><Link href="/projects/find">Back to Find Projects</Link></Button>
      </section>
    );
  }

  const typeLabel = PROJECT_TYPES.find((item) => item.value === listing.projectType)?.label ?? listing.category;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/projects/find" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />Find Projects
      </Link>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">{typeLabel}</span>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{listing.experienceLevel} experience</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{listing.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Posted by {listing.ownerName}</p>
          <h2 className="mt-8 font-semibold">Project description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{listing.description}</p>
          <h2 className="mt-8 font-semibold">Required skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {listing.requiredSkills.length ? listing.requiredSkills.map((skill) => (
              <span key={skill} className="rounded-md border border-border px-2.5 py-1 text-sm">{skill}</span>
            )) : <span className="text-sm text-muted-foreground">No specific skills listed.</span>}
          </div>
          <dl className="mt-8 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex gap-3"><CircleDollarSign aria-hidden="true" className="mt-0.5 size-4 text-brand" /><div><dt className="text-xs text-muted-foreground">Budget</dt><dd className="mt-1 text-sm font-medium">{listing.budget === null ? "Negotiable" : new Intl.NumberFormat(undefined, { style: "currency", currency: listing.currency, maximumFractionDigits: 0 }).format(listing.budget)}</dd></div></div>
            <div className="flex gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 size-4 text-brand" /><div><dt className="text-xs text-muted-foreground">Deadline</dt><dd className="mt-1 text-sm font-medium">{listing.deadline || "Flexible"}</dd></div></div>
            <div className="flex gap-3"><MapPin aria-hidden="true" className="mt-0.5 size-4 text-brand" /><div><dt className="text-xs text-muted-foreground">Work location</dt><dd className="mt-1 text-sm font-medium">{listing.remote ? "Remote" : listing.location || "On-site"}</dd></div></div>
          </dl>
        </article>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Project owner</p>
          <h2 className="mt-2 text-lg font-semibold">{listing.ownerName}</h2>
          {isOwner ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-muted-foreground">{listing.applicationCount} applications received.</p>
              <Button asChild className="w-full"><Link href="/projects/applications">Review applications</Link></Button>
            </div>
          ) : application ? (
            <div role="status" className="mt-5 rounded-xl border border-border bg-muted p-4">
              <p className="flex items-center gap-2 font-medium"><CheckCircle2 aria-hidden="true" className="size-4 text-brand" />Application {application.status}</p>
              {application.status === "accepted" && listing.projectId && (
                <Button asChild className="mt-4 w-full"><Link href={`/projects/${listing.projectId}`}>Open project workspace</Link></Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleApply} className="mt-5 space-y-4">
              <div className="space-y-2">
                <label htmlFor="application-message" className="text-sm font-medium">Message to the owner</label>
                <textarea id="application-message" required minLength={10} maxLength={2000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Introduce yourself and explain why you are a good fit." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
              </div>
              <div className="space-y-2">
                <label htmlFor="application-experience" className="text-sm font-medium">Relevant experience</label>
                <textarea id="application-experience" rows={3} maxLength={1500} value={experience} onChange={(event) => setExperience(event.target.value)} placeholder="Share related skills or examples." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
              </div>
              <div className="space-y-2">
                <label htmlFor="application-budget" className="text-sm font-medium">Proposed budget (optional)</label>
                <Input id="application-budget" type="number" min="0" value={proposedBudget} onChange={(event) => setProposedBudget(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="application-timeline" className="text-sm font-medium">Estimated completion (optional)</label>
                <Input id="application-timeline" value={estimatedCompletion} onChange={(event) => setEstimatedCompletion(event.target.value)} placeholder="e.g. 3 weeks" />
              </div>
              {error && <p role="alert" className="text-sm text-brand-dark dark:text-brand">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}><Send aria-hidden="true" />{submitting ? "Sending application…" : "Apply to this project"}</Button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
