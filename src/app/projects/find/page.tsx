"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownWideNarrow, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { PROJECT_TYPES } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { getProjectListings } from "@/services/marketplace/marketplaceStore";
import type { ProjectListing } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatBudget(listing: ProjectListing): string {
  if (listing.budget === null) return "Budget negotiable";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: listing.currency,
    maximumFractionDigits: 0,
  }).format(listing.budget);
}

export default function FindProjectsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ProjectListing[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [remote, setRemote] = useState("all");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("all");
  const [skill, setSkill] = useState("");
  const [experience, setExperience] = useState("all");
  const [maxBudget, setMaxBudget] = useState("");
  const [deadlineWindow, setDeadlineWindow] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let current = true;
    void getProjectListings().then((items) => {
      if (current) setListings(items);
    }).catch((cause) => {
      if (current) setError(cause instanceof Error ? cause.message : "Public opportunities could not be loaded.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [user]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const skillTerm = skill.trim().toLowerCase();
    const matching = listings.filter((listing) => {
      const textMatches = !term || [
        listing.title,
        listing.description,
        listing.category,
        listing.location,
        listing.ownerName,
        ...listing.requiredSkills,
      ].some((value) => value.toLowerCase().includes(term));
      const typeMatches = type === "all" || listing.projectType === type;
      const categoryMatches = category === "all" || listing.category === category;
      const skillMatches = !skillTerm || listing.requiredSkills.some((value) => value.toLowerCase().includes(skillTerm));
      const remoteMatches = remote === "all" || String(listing.remote) === remote;
      const locationMatches = !location.trim() || listing.location.toLowerCase().includes(location.trim().toLowerCase());
      const experienceMatches = experience === "all" || listing.experienceLevel.toLowerCase() === experience.toLowerCase();
      const budgetMatches = !maxBudget || listing.budget === null || listing.budget <= Number(maxBudget);
      const deadlineMatches = deadlineWindow === "all" ||
        (deadlineWindow === "set" && Boolean(listing.deadline)) ||
        (deadlineWindow === "flexible" && !listing.deadline);
      return textMatches && typeMatches && categoryMatches && skillMatches && remoteMatches && locationMatches && experienceMatches && budgetMatches && deadlineMatches;
    });
    return matching.sort((left, right) => {
      if (sort === "budget-high") return (right.budget ?? 0) - (left.budget ?? 0);
      if (sort === "budget-low") return (left.budget ?? Number.MAX_SAFE_INTEGER) - (right.budget ?? Number.MAX_SAFE_INTEGER);
      if (sort === "deadline") return left.deadline.localeCompare(right.deadline);
      return right.createdAt.localeCompare(left.createdAt);
    });
  }, [listings, query, type, category, skill, remote, location, experience, maxBudget, deadlineWindow, sort]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">ScopeSync marketplace</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Find Projects</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Discover published opportunities, review the brief, and apply to work together.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/projects/my-applications">My applications</Link></Button>
          <Button asChild variant="outline"><Link href="/projects/applications">Applications received</Link></Button>
        </div>
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg border border-brand/25 bg-brand/10 p-3 text-sm">{error}</p>}

      <section aria-label="Search and filter opportunities" className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search project listings" placeholder="Search title, skills, location…" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" />
        </div>
        <label className="sr-only" htmlFor="market-project-type">Project type</label>
        <select id="market-project-type" value={type} onChange={(event) => setType(event.target.value)} className="h-11 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="all">All project types</option>
          {PROJECT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <label className="sr-only" htmlFor="market-category">Project category</label>
        <select id="market-category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="all">All categories</option>
          {[...new Set(listings.map((listing) => listing.category))].sort().map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <label className="sr-only" htmlFor="market-skill">Required skill</label>
        <Input id="market-skill" placeholder="Filter by skill" value={skill} onChange={(event) => setSkill(event.target.value)} />
        <label className="sr-only" htmlFor="market-location">Work location</label>
        <select id="market-location" value={remote} onChange={(event) => setRemote(event.target.value)} className="h-11 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="all">Any location</option>
          <option value="true">Remote</option>
          <option value="false">On-site</option>
        </select>
        <label className="sr-only" htmlFor="market-location-query">Filter by location</label>
        <Input id="market-location-query" placeholder="City or location" value={location} onChange={(event) => setLocation(event.target.value)} />
        <label className="sr-only" htmlFor="market-experience">Experience level</label>
        <select id="market-experience" value={experience} onChange={(event) => setExperience(event.target.value)} className="h-11 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="all">Any experience</option>
          {["Any", "Entry", "Intermediate", "Expert"].map((level) => <option key={level} value={level}>{level}</option>)}
        </select>
        <label className="sr-only" htmlFor="market-budget">Maximum budget</label>
        <Input id="market-budget" type="number" min="0" placeholder="Maximum budget" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} />
        <label className="sr-only" htmlFor="market-deadline">Deadline</label>
        <select id="market-deadline" value={deadlineWindow} onChange={(event) => setDeadlineWindow(event.target.value)} className="h-11 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="all">Any deadline</option>
          <option value="set">Deadline set</option>
          <option value="flexible">Flexible deadline</option>
        </select>
        <label className="sr-only" htmlFor="market-sort">Sort opportunities</label>
        <select id="market-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="newest">Newest first</option>
          <option value="budget-high">Budget: high to low</option>
          <option value="budget-low">Budget: low to high</option>
          <option value="deadline">Deadline: soonest</option>
        </select>
      </section>

      <div className="mt-5 flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}</span>
        <span className="inline-flex items-center gap-1"><SlidersHorizontal aria-hidden="true" className="size-4" />Skills searched with keywords</span>
      </div>

      {loading ? (
        <div role="status" className="mt-5 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading public opportunities…</div>
      ) : filtered.length ? (
        <section aria-label="Public project opportunities" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((listing) => {
            const typeLabel = PROJECT_TYPES.find((item) => item.value === listing.projectType)?.label ?? listing.category;
            return (
              <Link
                key={listing.id}
                href={`/projects/find/${listing.id}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">{typeLabel}</span>
                  <ArrowDownWideNarrow aria-hidden="true" className="size-4 rotate-180 text-muted-foreground" />
                </div>
                <h2 className="mt-4 line-clamp-2 text-lg font-semibold text-slate-950 group-hover:text-brand">{listing.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{listing.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {listing.requiredSkills.slice(0, 4).map((skill) => (
                    <span key={skill} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">{skill}</span>
                  ))}
                  {listing.requiredSkills.length > 4 && <span className="px-1 py-1 text-xs text-muted-foreground">+{listing.requiredSkills.length - 4}</span>}
                </div>
                <div className="mt-5 flex items-end justify-between gap-2 border-t border-border pt-4">
                  <div>
                    <p className="font-semibold text-slate-950">{formatBudget(listing)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">by {listing.ownerName}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3.5" />{listing.remote ? "Remote" : listing.location || "On-site"}
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <section className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-slate-950">{query || type !== "all" || category !== "all" || skill || remote !== "all" || location || experience !== "all" || maxBudget || deadlineWindow !== "all" ? "No matching opportunities" : "No published opportunities yet"}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            {query || type !== "all" || category !== "all" || skill || remote !== "all" || location || experience !== "all" || maxBudget || deadlineWindow !== "all"
              ? "Try changing your search or filters."
              : "Published public opportunities from other ScopeSync members will appear here."}
          </p>
        </section>
      )}
    </div>
  );
}
