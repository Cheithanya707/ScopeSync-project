"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowRight, Check, CircleAlert, Plus } from "lucide-react";
import { RecentActivity } from "@/components/activity/RecentActivity";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { getMyProjects, getProjectApplications } from "@/services/marketplace/marketplaceStore";
import { getWorkspaceCalendarEvents } from "@/services/calendar/calendarService";
import { getWorkspaceMembers } from "@/services/people/memberStore";
import { formatDateOnly } from "@/lib/dates";
import { getIsLocalDemoMode, setLocalDemoMode, subscribeToLocalDemoMode } from "@/lib/localData";
import type { CalendarEvent } from "@/types";
import { DriftGauge, GlassCard, GlowButton, IdChip, ScopeThread, SectionLabel, StatusStamp } from "@/src/ui/primitives";

type MarketplaceSummary = { active: number; completed: number; pending: number; received: number };

function DashboardContent() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const ownerId = user?.uid ?? "local-preview-user";
  const activeWorkspaceId = workspace.workspaceId ?? ownerId;
  const [activeProjectCount, setActiveProjectCount] = useState<number | null>(null);
  const [countError, setCountError] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(false);
  const [peopleCount, setPeopleCount] = useState<number | null>(null);
  const [peopleError, setPeopleError] = useState(false);
  const [marketplaceSummary, setMarketplaceSummary] = useState<MarketplaceSummary>({
    active: 0,
    completed: 0,
    pending: 0,
    received: 0,
  });
  const [marketplaceError, setMarketplaceError] = useState("");

  useEffect(() => {
    if (!user) return;
    let current = true;
    void Promise.all([
      getMyProjects(),
      getProjectApplications("mine"),
      getProjectApplications("received"),
    ]).then(([projects, ownApplications, receivedApplications]) => {
      if (!current) return;
      const active = projects.filter((project) => project.status === "active").length;
      setActiveProjectCount(active);
      setMarketplaceSummary({
        active,
        completed: projects.filter((project) => project.status === "completed").length,
        pending: ownApplications.filter((application) => ["pending", "shortlisted"].includes(application.status)).length,
        received: receivedApplications.filter((application) => ["pending", "shortlisted"].includes(application.status)).length,
      });
      setMarketplaceError("");
    }).catch((cause) => {
      if (current) {
        setMarketplaceError(cause instanceof Error ? "Marketplace activity could not be loaded. Try again when your connection is available." : "Marketplace activity could not be loaded.");
        setCountError(true);
      }
    });
    return () => { current = false; };
  }, [user]);
  useEffect(() => {
    if (!workspace.workspaceId) return;
    let current = true;
    void getWorkspaceMembers(ownerId, activeWorkspaceId).then((people) => {
      if (current) setPeopleCount(people.length);
    }).catch(() => {
      if (current) setPeopleError(true);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, ownerId, workspace.workspaceId]);
  useEffect(() => {
    if (!workspace.workspaceId) return;
    let current = true;
    void getWorkspaceCalendarEvents(ownerId, activeWorkspaceId).then((events) => {
      if (current) setUpcomingEvents(events);
    }).catch(() => {
      if (current) setCalendarError(true);
    }).finally(() => {
      if (current) setCalendarLoading(false);
    });
    return () => { current = false; };
  }, [activeWorkspaceId, ownerId, workspace.workspaceId]);

  const firstName = user?.displayName?.trim().split(/\s+/)[0] || "there";
  const nextActionHref = activeProjectCount ? "/projects" : "/projects/new";
  const visibleEvents = workspace.workspaceId ? upcomingEvents : [];
  const visiblePeopleCount = workspace.workspaceId ? peopleCount : 0;
  const visiblePeopleError = workspace.workspaceId && peopleError;
  const visibleCalendarLoading = workspace.workspaceId ? calendarLoading : false;
  const visibleCalendarError = workspace.workspaceId && calendarError;

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <SectionLabel>WORKSPACE / {workspace.workspace?.name ?? "YOUR SPACE"}</SectionLabel>
          <h1>Welcome back, {firstName}.</h1>
          <p>Your work, decisions, and next steps in one clear view.</p>
        </div>
        <GlowButton href="/projects/new"><Plus size={16} /> New project</GlowButton>
      </div>

      {marketplaceError && <p role="alert" className="dashboard-error"><CircleAlert size={16} />{marketplaceError}</p>}

      <div className="dashboard-grid">
        <GlassCard className="dashboard-card dashboard-next-action">
          <div className="dashboard-card__heading"><SectionLabel>YOUR NEXT ACTION</SectionLabel><IdChip>{countError ? "ACTION" : `ACTIVE / ${String(activeProjectCount ?? "—").padStart(2, "0")}`}</IdChip></div>
          <div className="dashboard-next-action__content">
            <span className="dashboard-check"><Check size={18} /></span>
            <div><h2>{activeProjectCount ? "Pick up where your team left off." : "Set your first project baseline."}</h2><p>{activeProjectCount ? "Review active projects and keep the next decision connected to the scope." : "Start with a brief, a clear outcome, and the people who need to agree."}</p></div>
          </div>
          <Link href={nextActionHref} className="dashboard-card__link">{activeProjectCount ? "Open projects" : "Create a project"} <ArrowRight size={15} /></Link>
        </GlassCard>

        <GlassCard className="dashboard-card dashboard-drift-card">
          <div className="dashboard-card__heading"><SectionLabel>SCOPE SIGNAL</SectionLabel><IdChip>BASELINE</IdChip></div>
          <div className="dashboard-drift-card__body">
            <DriftGauge value={null} label="Scope drift" />
            <div><h2>Baseline required</h2><p>Scope drift becomes measurable once a project has an agreed baseline.</p><Link href="/projects/new">Set a baseline <ArrowRight size={14} /></Link></div>
          </div>
        </GlassCard>

        <GlassCard className="dashboard-card dashboard-map-card">
          <div className="dashboard-card__heading"><SectionLabel>MINI SCOPE MAP</SectionLabel><IdChip>{visiblePeopleError ? "TEAM / —" : `TEAM / ${String(visiblePeopleCount ?? "—").padStart(2, "0")}`}</IdChip></div>
          <ScopeThread className="dashboard-map-card__thread" />
          <div className="dashboard-map-card__labels"><span>Brief</span><span>Requirements</span><span>Changes</span><span>Delivery</span></div>
          <p>One connected thread from intent to outcome.</p>
        </GlassCard>

        <GlassCard className="dashboard-card dashboard-decision-card">
          <div className="dashboard-card__heading"><SectionLabel>NEEDS YOUR DECISION</SectionLabel><StatusStamp status={marketplaceSummary.received ? "pending" : "approved"} label={marketplaceSummary.received ? "Waiting" : "Clear"} /></div>
          <h2>{marketplaceSummary.received ? `${marketplaceSummary.received} application${marketplaceSummary.received === 1 ? "" : "s"} need review` : "Nothing waiting on your decision"}</h2>
          <p>{marketplaceSummary.received ? "Review incoming project applications and record your next step." : "When a decision is needed, it will be surfaced here with its context."}</p>
          <Link href="/projects/applications" className="dashboard-card__link">Review decisions <ArrowRight size={15} /></Link>
        </GlassCard>

        <GlassCard className="dashboard-card dashboard-week-card">
          <div className="dashboard-card__heading"><SectionLabel>THIS WEEK</SectionLabel><Link href="/calendar" className="dashboard-card__link">Calendar <ArrowRight size={14} /></Link></div>
          {visibleCalendarLoading ? (
            <p className="dashboard-muted" role="status">Loading this week…</p>
          ) : visibleCalendarError ? (
            <p className="dashboard-muted" role="alert">This week’s dates are temporarily unavailable.</p>
          ) : visibleEvents.length ? (
            <ul className="dashboard-week-list">{visibleEvents.slice(0, 3).map((event) => (
              <li key={event.id}><time>{formatDateOnly(event.date, { weekday: "short", day: "numeric" })}</time><span>{event.title}</span><IdChip>{event.projectName}</IdChip></li>
            ))}</ul>
          ) : <p className="dashboard-muted">No milestones scheduled this week.</p>}
        </GlassCard>

        <GlassCard className="dashboard-card dashboard-ledger-card">
          <div className="dashboard-card__heading"><div><SectionLabel>THE LEDGER</SectionLabel><h2>Recent activity</h2></div><Link href="/activity" className="dashboard-card__link">View all <ArrowRight size={14} /></Link></div>
          <RecentActivity workspaceId={workspace.workspaceId ?? undefined} limit={4} />
        </GlassCard>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const isLocalDemoMode = useSyncExternalStore(
    subscribeToLocalDemoMode,
    getIsLocalDemoMode,
    () => false,
  );

  return isLocalDemoMode ? <DemoDashboard /> : <DashboardContent />;
}

function DemoDashboard() {
  const { user } = useAuth();
  const firstName = user?.displayName?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <SectionLabel>LOCAL DEMO / SAMPLE DATA</SectionLabel>
          <h1>Welcome, {firstName}.</h1>
          <p>This read-only dashboard uses illustrative sample data.</p>
        </div>
        <GlowButton variant="secondary" onClick={() => setLocalDemoMode(false)}>
          Exit demo
        </GlowButton>
      </div>

      <p role="status" className="dashboard-error">
        Sample only — connect a backend to load or save your real workspace data.
      </p>

      <div className="dashboard-grid">
        <GlassCard className="dashboard-card dashboard-next-action">
          <div className="dashboard-card__heading"><SectionLabel>YOUR NEXT ACTION</SectionLabel><IdChip>ACTIVE / 02</IdChip></div>
          <div className="dashboard-next-action__content">
            <span className="dashboard-check"><Check size={18} /></span>
            <div><h2>Review the Atlas launch scope.</h2><p>Two requirements need a final check before the team locks the baseline.</p></div>
          </div>
          <p className="dashboard-card__link">Next review · Atlas launch</p>
        </GlassCard>

        <GlassCard className="dashboard-card dashboard-drift-card">
          <div className="dashboard-card__heading"><SectionLabel>SCOPE SIGNAL</SectionLabel><IdChip>SAMPLE</IdChip></div>
          <div className="dashboard-drift-card__body">
            <DriftGauge value={12} label="Sample scope drift" />
            <div><h2>2 changes to review</h2><p>Illustrative sample only; live drift requires a connected workspace baseline.</p></div>
          </div>
        </GlassCard>

        <GlassCard className="dashboard-card dashboard-map-card">
          <div className="dashboard-card__heading"><SectionLabel>MINI SCOPE MAP</SectionLabel><IdChip>TEAM / 04</IdChip></div>
          <ScopeThread className="dashboard-map-card__thread" />
          <div className="dashboard-map-card__labels"><span>Brief</span><span>Requirements</span><span>Changes</span><span>Delivery</span></div>
          <p>Atlas launch · one connected sample thread.</p>
        </GlassCard>

        <GlassCard className="dashboard-card dashboard-decision-card">
          <div className="dashboard-card__heading"><SectionLabel>NEEDS YOUR DECISION</SectionLabel><StatusStamp status="pending" label="2 waiting" /></div>
          <h2>Two scope changes need approval</h2>
          <p>Review the illustrative change requests before the sample team updates its plan.</p>
        </GlassCard>

        <GlassCard className="dashboard-card dashboard-week-card">
          <div className="dashboard-card__heading"><SectionLabel>THIS WEEK</SectionLabel><IdChip>3 MILESTONES</IdChip></div>
          <ul className="dashboard-week-list">
            <li><time>MON</time><span>Requirements review</span><IdChip>ATLAS</IdChip></li>
            <li><time>WED</time><span>Scope approval</span><IdChip>ATLAS</IdChip></li>
            <li><time>FRI</time><span>Delivery check-in</span><IdChip>ORBIT</IdChip></li>
          </ul>
        </GlassCard>

        <GlassCard className="dashboard-card dashboard-ledger-card">
          <div className="dashboard-card__heading"><div><SectionLabel>THE LEDGER</SectionLabel><h2>Recent activity</h2></div><IdChip>SAMPLE</IdChip></div>
          <ul className="dashboard-week-list">
            <li><time>09:42</time><span>Baseline shared with the team</span><IdChip>ATLAS</IdChip></li>
            <li><time>YEST.</time><span>Change request submitted</span><IdChip>ORBIT</IdChip></li>
            <li><time>OCT 06</time><span>Requirement marked ready</span><IdChip>ATLAS</IdChip></li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
