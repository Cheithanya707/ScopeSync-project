"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Eye, Pencil, Plus, Send, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FREELANCER_PROJECT_TYPES, PROJECT_CURRENCIES, PROJECT_TYPES } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { getProjectListings, saveProjectListing, updateProjectListingStatus } from "@/services/marketplace/marketplaceStore";
import type { ListingStatus, ProjectListing } from "@/types/marketplace";
import type { ProjectType } from "@/types";

type FormValues = {
  title: string;
  description: string;
  projectType: ProjectType | "";
  skills: string;
  budget: string;
  currency: ProjectListing["currency"];
  deadline: string;
  location: string;
  remote: boolean;
  experienceLevel: string;
  maxCollaborators: string;
};

const blankForm: FormValues = {
  title: "",
  description: "",
  projectType: "",
  skills: "",
  budget: "",
  currency: "INR",
  deadline: "",
  location: "",
  remote: true,
  experienceLevel: "Any",
  maxCollaborators: "1",
};

function formFromListing(listing: ProjectListing): FormValues {
  return {
    title: listing.title,
    description: listing.description,
    projectType: listing.projectType,
    skills: listing.requiredSkills.join(", "),
    budget: listing.budget === null ? "" : String(listing.budget),
    currency: listing.currency,
    deadline: listing.deadline,
    location: listing.location,
    remote: listing.remote,
    experienceLevel: listing.experienceLevel,
    maxCollaborators: String(listing.maxCollaborators),
  };
}

function listingStatusLabel(status: ListingStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function UploadProjectPage() {
  const { user } = useAuth();
  const [values, setValues] = useState<FormValues>(blankForm);
  const [listings, setListings] = useState<ProjectListing[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    if (!user) return;
    let current = true;
    void getProjectListings(true).then((items) => {
      if (current) setListings(items);
    }).catch((cause) => {
      if (current) setError(cause instanceof Error ? cause.message : "Your opportunities could not be loaded.");
    }).finally(() => {
      if (current) setLoadingListings(false);
    });
    return () => { current = false; };
  }, [user]);

  const save = async (status: Extract<ListingStatus, "draft" | "published">): Promise<ProjectListing | null> => {
    setError("");
    setSuccess("");
    if (!user) {
      setError("Sign in before creating a listing.");
      return null;
    }
    if (status === "published" && (!values.description.trim() || !values.projectType)) {
      setError("A published listing needs a description and project type.");
      return null;
    }
    setSaving(true);
    try {
      const listing = await saveProjectListing({
        title: values.title.trim(),
        description: values.description.trim(),
        projectType: values.projectType || "other",
        category: PROJECT_TYPES.find((item) => item.value === values.projectType)?.label ?? "Other",
        requiredSkills: values.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        budget: values.budget ? Number(values.budget) : null,
        currency: values.currency,
        deadline: values.deadline,
        location: values.location.trim(),
        remote: values.remote,
        experienceLevel: values.experienceLevel,
        maxCollaborators: Number(values.maxCollaborators),
        status,
      }, editingId);
      setEditingId(listing.id);
      setListings((current) => [listing, ...current.filter((item) => item.id !== listing.id)]);
      setSuccess(status === "published"
        ? "Opportunity published and is now available in Find Projects."
        : "Draft saved. Preview and publish it when it is ready.");
      return listing;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The listing could not be saved.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const listing = await save("draft");
    if (listing) setPreview(true);
  };

  const editListing = (listing: ProjectListing) => {
    setEditingId(listing.id);
    setValues(formFromListing(listing));
    setPreview(false);
    setSuccess("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeStatus = async (listing: ProjectListing, status: "published" | "paused" | "closed") => {
    if (!user) return;
    try {
      const updated = await updateProjectListingStatus(listing.id, status);
      setListings((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSuccess(`Listing ${status === "paused" ? "paused" : status === "published" ? "published" : "closed"}.`);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The listing status could not be changed.");
    }
  };

  const selectedType = PROJECT_TYPES.find((item) => item.value === values.projectType)?.label ?? "Other";

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/projects/find" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />Marketplace
      </Link>
      <div className="mt-5">
        <p className="text-sm font-medium text-brand">ScopeSync marketplace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Upload Project</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Publish a work opportunity so potential collaborators can discover and apply.
        </p>
      </div>

      <div role="note" className="mt-5 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
        “Upload” means create a project opportunity, not upload a file. Published opportunities become discoverable in Find Projects.
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-brand/25 bg-brand/10 p-3 text-sm text-foreground">{error}</p>}
      {success && <p role="status" className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm text-foreground">{success}</p>}

      {!preview ? (
        <form onSubmit={handlePreview} className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="listing-title" className="text-sm font-medium">Project title</label>
              <Input id="listing-title" required maxLength={120} value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} placeholder="e.g. Need a Next.js developer" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="listing-description" className="text-sm font-medium">Project description</label>
              <textarea id="listing-description" required rows={5} maxLength={5000} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} placeholder="Describe the work, expected deliverables, and what a successful result looks like." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
            </div>
            <div className="space-y-2">
              <label htmlFor="listing-type" className="text-sm font-medium">Project type</label>
              <select id="listing-type" required value={values.projectType} onChange={(event) => setValues({ ...values, projectType: event.target.value as ProjectType | "" })} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">Choose a project type</option>
                {FREELANCER_PROJECT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="listing-skills" className="text-sm font-medium">Required skills</label>
              <Input id="listing-skills" value={values.skills} onChange={(event) => setValues({ ...values, skills: event.target.value })} placeholder="Next.js, React, TypeScript" />
              <p className="text-xs text-muted-foreground">Separate skills with commas.</p>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
              <div className="space-y-2">
                <label htmlFor="listing-budget" className="text-sm font-medium">Budget</label>
                <Input id="listing-budget" type="number" min="0" step="1" value={values.budget} onChange={(event) => setValues({ ...values, budget: event.target.value })} placeholder="Negotiable" />
              </div>
              <div className="space-y-2">
                <label htmlFor="listing-currency" className="text-sm font-medium">Currency</label>
                <select id="listing-currency" value={values.currency} onChange={(event) => setValues({ ...values, currency: event.target.value as ProjectListing["currency"] })} className="h-11 w-full rounded-lg border border-input bg-background px-2 text-sm">
                  {PROJECT_CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="listing-deadline" className="text-sm font-medium">Deadline</label>
              <Input id="listing-deadline" type="date" min={new Date().toISOString().slice(0, 10)} value={values.deadline} onChange={(event) => setValues({ ...values, deadline: event.target.value })} />
            </div>
            <div className="space-y-2">
              <label htmlFor="listing-experience" className="text-sm font-medium">Experience level</label>
              <select id="listing-experience" value={values.experienceLevel} onChange={(event) => setValues({ ...values, experienceLevel: event.target.value })} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
                {["Any", "Entry", "Intermediate", "Expert"].map((level) => <option key={level}>{level}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="listing-collaborators" className="text-sm font-medium">Collaborators to accept</label>
              <Input id="listing-collaborators" type="number" min="1" max="20" step="1" required value={values.maxCollaborators} onChange={(event) => setValues({ ...values, maxCollaborators: event.target.value })} />
              <p className="text-xs text-muted-foreground">The owner can accept up to this many people for one shared workspace.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="listing-location" className="text-sm font-medium">Location</label>
              <Input id="listing-location" value={values.location} onChange={(event) => setValues({ ...values, location: event.target.value })} placeholder="City or region" disabled={values.remote} />
            </div>
            <label className="flex min-h-11 items-center gap-3 self-end rounded-lg border border-border px-3 text-sm">
              <input type="checkbox" checked={values.remote} onChange={(event) => setValues({ ...values, remote: event.target.checked })} className="size-4 accent-brand" />
              Remote work is available
            </label>
          </div>
          <div className="mt-7 flex flex-col-reverse justify-between gap-3 border-t border-border pt-5 sm:flex-row">
            <Button type="button" variant="outline" disabled={saving} onClick={() => { void save("draft").then((listing) => { if (listing) setValues(blankForm); }); }}>
              <Pencil aria-hidden="true" />Save draft
            </Button>
            <Button type="submit" disabled={saving}><Eye aria-hidden="true" />{saving ? "Saving…" : "Preview listing"}</Button>
          </div>
        </form>
      ) : (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-medium uppercase tracking-wide text-brand">Preview · Draft</p><h2 className="mt-2 text-2xl font-semibold">{values.title || "Untitled opportunity"}</h2></div>
            <Button type="button" variant="outline" onClick={() => setPreview(false)}><Pencil aria-hidden="true" />Edit details</Button>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{values.description || "Add a description to help potential collaborators understand the work."}</p>
          <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <div><dt className="text-xs text-muted-foreground">Project type</dt><dd className="mt-1 text-sm font-medium">{selectedType}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Budget</dt><dd className="mt-1 text-sm font-medium">{values.budget ? `${values.currency} ${values.budget}` : "Negotiable"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Deadline</dt><dd className="mt-1 text-sm font-medium">{values.deadline || "Flexible"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Work mode</dt><dd className="mt-1 text-sm font-medium">{values.remote ? "Remote" : values.location || "On-site"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Experience</dt><dd className="mt-1 text-sm font-medium">{values.experienceLevel}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Collaborators</dt><dd className="mt-1 text-sm font-medium">{values.maxCollaborators}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Skills</dt><dd className="mt-1 text-sm font-medium">{values.skills || "Not specified"}</dd></div>
          </dl>
          <div className="mt-7 flex flex-col-reverse justify-between gap-3 border-t border-border pt-5 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => { setPreview(false); setValues(blankForm); setEditingId(undefined); }}>Start another listing</Button>
            <Button type="button" disabled={saving} onClick={() => { void save("published").then((listing) => { if (listing) setPreview(false); }); }}><Send aria-hidden="true" />{saving ? "Publishing…" : "Publish opportunity"}</Button>
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Your opportunities</h2><p className="mt-1 text-sm text-muted-foreground">Drafts and listings you have published.</p></div>
          <Button asChild variant="outline"><Link href="/projects/applications"><UsersRound aria-hidden="true" />Review applications</Link></Button>
        </div>
        {loadingListings ? (
          <p role="status" className="mt-4 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading your opportunities…</p>
        ) : listings.length ? (
          <ul className="mt-4 space-y-3">
            {listings.map((listing) => (
              <li key={listing.id} className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold">{listing.title}</h3>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{listingStatusLabel(listing.status)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{listing.applicationCount} applications · {listing.category}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => editListing(listing)}><Pencil aria-hidden="true" />Edit</Button>
                  {listing.status === "draft" || listing.status === "paused" ? (
                    <Button size="sm" onClick={() => changeStatus(listing, "published")}><Send aria-hidden="true" />Publish</Button>
                  ) : listing.status === "published" ? (
                    <Button size="sm" variant="outline" onClick={() => changeStatus(listing, "paused")}>Pause</Button>
                  ) : null}
                  {listing.status === "published" && <Button size="sm" variant="outline" asChild><Link href={`/projects/find/${listing.id}`}>View</Link></Button>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
            You have not created any opportunities yet.
            <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); document.getElementById("listing-title")?.focus(); }} className="ml-1 inline-flex items-center gap-1 font-medium text-brand hover:underline"><Plus aria-hidden="true" className="size-3.5" />Create one</button>
          </div>
        )}
      </section>
    </div>
  );
}
