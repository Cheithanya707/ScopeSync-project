"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, CircleAlert, ExternalLink, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { RecentActivity } from "@/components/activity/RecentActivity";
import { EventHeader } from "@/components/events/EventHeader";
import { EventSummaryCards } from "@/components/events/EventSummaryCards";
import { EventSetupForm, ParticipantForm, ScheduleItemForm, TeamForm } from "@/components/events/EventForms";
import { ConfirmActionDialog } from "@/components/ui/ConfirmActionDialog";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useProjectPreview } from "@/hooks/useProjectPreview";
import { EVENT_PROJECT_TYPES, EVENT_TEAM_STATUSES, REGISTRATION_STATUSES, PARTICIPANT_PAYMENT_STATUSES, SCHEDULE_ITEM_TYPES } from "@/lib/constants/events";
import { createActivity } from "@/services/local/activityService";
import { createNotification } from "@/services/local/notificationService";
import { createEventDetails, getEventDetails, updateEventDetails } from "@/services/local/eventService";
import { createParticipant, deleteParticipant, getParticipant, getParticipants, updateParticipant } from "@/services/local/eventParticipantService";
import { createEventTeam, deleteEventTeam, getEventTeams, removeParticipantFromTeam, updateEventTeam } from "@/services/local/eventTeamService";
import { createScheduleItem, deleteScheduleItem, getScheduleItems } from "@/services/local/eventScheduleService";
import { getProjectDocuments } from "@/services/documents/documentStore";
import { getProjectPayments } from "@/services/payments/paymentStore";
import { getTasks } from "@/services/tasks/taskStore";
import { getRequirements } from "@/services/requirements/requirementStore";
import { isLocalDataAvailable } from "@/lib/localData";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { EventDetails, EventParticipant, EventScheduleItem, EventTeam, Project, Requirement, Task } from "@/types";

type EventView = "overview" | "setup" | "participants" | "participant-new" | "participant-detail" | "participant-edit" | "teams" | "team-new" | "schedule" | "schedule-new";
type Props = { projectId: string; view: EventView; participantId?: string };
type PendingConfirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  fallbackError: string;
  run: () => Promise<void>;
};
const card = "rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6";
const button = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const secondary = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const input = "min-h-10 rounded-lg border border-input bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-brand";

function SectionHeading({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">{title}</h2>{description && <p className="mt-1 text-sm text-slate-600">{description}</p>}</div>{action}</div>;
}

function Loading({ message = "Loading event…" }: { message?: string }) {
  return <div role="status" className={`${card} animate-pulse text-center text-sm text-slate-600`}>{message}</div>;
}

function ErrorNotice({ message }: { message: string }) {
  return message ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{message}</p> : null;
}

function ProgressRow({ label, value, description }: { label: string; value: number | null; description: string }) {
  return <div><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-medium text-slate-800">{label}</span><span className="text-slate-600">{value === null ? description : `${value}% · ${description}`}</span></div>{value !== null && <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} /></div>}</div>;
}

function dateLabel(value?: string) {
  if (!value) return "Not scheduled";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function teamStatusLabel(status: EventTeam["status"]) {
  return EVENT_TEAM_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function EventManagementPage({ projectId, view, participantId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, workspace } = useWorkspace();
  const { project, loading: projectLoading, error: projectError, ownerId } = useProjectPreview(projectId);
  const [details, setDetails] = useState<EventDetails | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [schedule, setSchedule] = useState<EventScheduleItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [documentCount, setDocumentCount] = useState<number>(0);
  const [paymentCount, setPaymentCount] = useState<number>(0);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [confirmationLoading, setConfirmationLoading] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");
  const [notice, setNotice] = useState("");
  const [notificationWarning, setNotificationWarning] = useState("");
  const [participant, setParticipant] = useState<EventParticipant | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("");
  const eventProject = Boolean(project && EVENT_PROJECT_TYPES.has(project.type));

  const confirmPendingAction = async () => {
    if (!pendingConfirmation) return;
    setConfirmationLoading(true);
    setConfirmationError("");
    try {
      await pendingConfirmation.run();
      setPendingConfirmation(null);
    } catch (caught) {
      setConfirmationError(caught instanceof Error ? caught.message : pendingConfirmation.fallbackError);
    } finally {
      setConfirmationLoading(false);
    }
  };

  const refresh = useCallback(async () => {
    if (!project) return;
    setLoadingData(true);
    setError("");
    try {
      const [event, eventParticipants, eventTeams, eventSchedule] = await Promise.all([
        getEventDetails(project.id, project.workspaceId, ownerId),
        getParticipants(project.id, project.workspaceId, ownerId),
        getEventTeams(project.id, project.workspaceId, ownerId),
        getScheduleItems(project.id, project.workspaceId, ownerId),
      ]);
      setDetails(event);
      setParticipants(eventParticipants);
      setTeams(eventTeams);
      setSchedule(eventSchedule);
      const [taskResult, requirementResult, documentResult, paymentResult] = await Promise.allSettled([
        getTasks(ownerId, project),
        getRequirements(ownerId, project),
        getProjectDocuments(ownerId, project),
        getProjectPayments(ownerId, project),
      ]);
      if (taskResult.status === "fulfilled") setTasks(taskResult.value);
      if (requirementResult.status === "fulfilled") setRequirements(requirementResult.value);
      if (documentResult.status === "fulfilled") setDocumentCount(documentResult.value.length);
      if (paymentResult.status === "fulfilled") setPaymentCount(paymentResult.value.length);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Event data could not be loaded.");
    } finally {
      setLoadingData(false);
    }
  }, [project, ownerId]);

  useEffect(() => {
    if (!project) return;
    void Promise.resolve().then(() => refresh());
  }, [project, refresh]);

  useEffect(() => {
    if (!participantId || !project) {
      void Promise.resolve().then(() => setParticipant(null));
      return;
    }
    let active = true;
    void getParticipant(participantId, project.id, project.workspaceId, ownerId).then((result) => {
      if (active) setParticipant(result);
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof Error ? caught.message : "Participant could not be loaded.");
    });
    return () => { active = false; };
  }, [participantId, project, ownerId]);

  const notifyOwner = async (title: string, message: string, entityId?: string, entityType: "project" | "member" | "calendar" = "project") => {
    if (!isLocalDataAvailable || !user || !workspace?.ownerId || workspace.ownerId === user.uid || !profile?.workspaceId) return;
    try {
      await createNotification({
        workspaceId: profile.workspaceId,
        userId: workspace.ownerId,
        projectId,
        type: "team_update",
        priority: "normal",
        title,
        message,
        entityType,
        entityId,
        actionUrl: `/projects/${projectId}/event`,
      });
    } catch {
      setNotificationWarning("The event change was saved, but its notification could not be sent.");
    }
  };

  const ensureEventDetails = async (data: EventDetails) => {
    setSaving(true); setError(""); setNotice("");
    try {
      if (details) await updateEventDetails(projectId, data.workspaceId, data, ownerId);
      else await createEventDetails(data, ownerId);
      await refresh();
      setNotice("Event details saved.");
      if (!details && user && profile) await createActivity({
        workspaceId: data.workspaceId, projectId, actorId: user.uid, actorName: profile.displayName || user.displayName || "Workspace member",
        actorPhotoURL: profile.photoURL || user.photoURL || undefined, entityType: "project", entityId: projectId,
        entityName: data.eventName, action: "updated", description: `Configured event details for "${data.eventName}".`,
      }).catch(() => setNotificationWarning("Event details were saved, but activity could not be synced."));
      router.push(`/projects/${projectId}/event`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Event details could not be saved.");
    } finally { setSaving(false); }
  };

  const addParticipant = async (data: Omit<EventParticipant, "id" | "createdAt" | "updatedAt" | "registrationDate" | "projectId" | "workspaceId">) => {
    if (!project) return;
    setSaving(true);
    try {
      const created = await createParticipant({ ...data, projectId: project.id, workspaceId: project.workspaceId }, ownerId);
      await notifyOwner("Participant registered", `${created.name} was added to ${project.name}.`, created.id, "member");
      await refresh();
      router.push(`/projects/${projectId}/event/participants`);
    } finally { setSaving(false); }
  };

  const saveParticipant = async (data: Omit<EventParticipant, "id" | "createdAt" | "updatedAt" | "registrationDate" | "projectId" | "workspaceId">) => {
    if (!project || !participant) return;
    setSaving(true);
    try {
      await updateParticipant(participant.id, project.id, project.workspaceId, data, ownerId);
      await refresh();
      router.push(`/projects/${projectId}/event/participants/${participant.id}`);
    } finally { setSaving(false); }
  };

  const addTeam = async (data: Omit<EventTeam, "id" | "createdAt" | "updatedAt" | "projectId" | "workspaceId">) => {
    if (!project) return;
    setSaving(true);
    try {
      const team = await createEventTeam({ ...data, projectId: project.id, workspaceId: project.workspaceId }, ownerId);
      await notifyOwner("Event team created", `${team.name} was created for ${project.name}.`, team.id);
      await refresh();
      router.push(`/projects/${projectId}/event/teams`);
    } finally { setSaving(false); }
  };

  const addScheduleItem = async (data: Omit<EventScheduleItem, "id" | "createdAt" | "updatedAt">) => {
    setSaving(true);
    try {
      const item = await createScheduleItem(data, ownerId);
      await notifyOwner("Event schedule updated", `"${item.title}" was added to the event schedule.`, item.id, "calendar");
      await refresh();
      router.push(`/projects/${projectId}/event/schedule`);
    } finally { setSaving(false); }
  };

  const filteredParticipants = useMemo(() => participants.filter((item) => {
    const term = search.trim().toLowerCase();
    const matchesText = !term || `${item.name} ${item.email} ${item.college ?? ""} ${item.organization ?? ""}`.toLowerCase().includes(term);
    const matchesStatus = !statusFilter || item.registrationStatus === statusFilter;
    const matchesTeam = !teamFilter || item.teamId === teamFilter;
    const matchesPayment = !paymentFilter || (item.paymentStatus ?? "not_required") === paymentFilter;
    const matchesOrganization = !organizationFilter || item.college === organizationFilter || item.organization === organizationFilter;
    return matchesText && matchesStatus && matchesTeam && matchesPayment && matchesOrganization;
  }), [participants, search, statusFilter, teamFilter, paymentFilter, organizationFilter]);

  if (projectLoading || (project && loadingData)) return <Loading />;
  if (!project) return <section className={card}><h1 className="text-xl font-semibold text-slate-950">Project unavailable</h1><p className="mt-2 text-sm text-slate-600">{projectError || "This project is not available in the current workspace."}</p><Link href="/projects" className={`mt-5 ${button}`}>Back to projects</Link></section>;
  if (!eventProject) return <section className={`${card} mx-auto max-w-xl text-center`}><CircleAlert aria-hidden="true" className="mx-auto size-10 text-amber-600" /><h1 className="mt-4 text-xl font-semibold text-slate-950">This project is not configured as an event.</h1><p className="mt-2 text-sm text-slate-600">Event management is available for college, school, hackathon, workshop, conference, seminar, and organization event projects.</p><Link href={`/projects/${projectId}`} className={`mt-5 ${button}`}>Back to Project</Link></section>;

  const header = (
    <>
      <EventHeader project={project} details={details} />
      <ConfirmActionDialog
        open={Boolean(pendingConfirmation)}
        title={pendingConfirmation?.title ?? ""}
        description={pendingConfirmation?.description ?? ""}
        confirmLabel={pendingConfirmation?.confirmLabel ?? "Confirm"}
        loading={confirmationLoading}
        error={confirmationError}
        onCancel={() => {
          if (!confirmationLoading) {
            setPendingConfirmation(null);
            setConfirmationError("");
          }
        }}
        onConfirm={() => void confirmPendingAction()}
      />
    </>
  );
  const confirmedParticipants = participants.filter((item) => ["confirmed", "attended"].includes(item.registrationStatus)).length;
  const confirmedTeams = teams.filter((item) => ["confirmed", "completed"].includes(item.status)).length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const pendingTasks = tasks.filter((task) => !["completed", "cancelled"].includes(task.status)).length;

  if (view === "setup") return <AuthGuard>{header}<div className="mx-auto mt-7 max-w-4xl"><ErrorNotice message={error} /><EventSetupForm project={project} value={details} saving={saving} onSave={ensureEventDetails} onCancel={() => router.push(`/projects/${projectId}/event`)} /></div></AuthGuard>;
  if (view === "participant-new") return <>{header}<div className="mx-auto mt-7 max-w-3xl"><ErrorNotice message={error} /><ParticipantForm saving={saving} onSave={addParticipant} onCancel={() => router.push(`/projects/${projectId}/event/participants`)} /></div></>;
  if ((view === "participant-detail" || view === "participant-edit") && !participant) return <>{header}<section className={`${card} mt-7`}>{error || "Participant not found in this event."}<Link className="ml-3 text-brand hover:underline" href={`/projects/${projectId}/event/participants`}>Back to participants</Link></section></>;
  if (view === "participant-edit" && participant) return <>{header}<div className="mx-auto mt-7 max-w-3xl"><ParticipantForm value={participant} saving={saving} onSave={saveParticipant} onCancel={() => router.push(`/projects/${projectId}/event/participants/${participant.id}`)} /></div></>;
  if (view === "participant-detail" && participant) return <>{header}<section className={`${card} mt-7`}>
    <SectionHeading title="Participant profile" action={<div className="flex flex-wrap gap-2">
      <Link className={secondary} href={`/projects/${projectId}/event/participants/${participant.id}/edit`}>Edit participant</Link>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        onClick={() => {
          setConfirmationError("");
          setPendingConfirmation({
            title: `Remove ${participant.name} from this event?`,
            description: "This participant will be removed from the event.",
            confirmLabel: "Remove Participant",
            fallbackError: "Participant could not be removed.",
            run: async () => {
              await deleteParticipant(participant.id, project.id, project.workspaceId, ownerId);
              router.push(`/projects/${projectId}/event/participants`);
            },
          });
        }}
      >
        <Trash2 aria-hidden="true" className="size-4" />Remove Participant
      </button>
    </div>} />
    <ErrorNotice message={error} />
    <dl className="grid gap-4 sm:grid-cols-2">{[["Name", participant.name], ["Email", participant.email], ["Phone", participant.phone], ["College", participant.college], ["Organization", participant.organization], ["Department", participant.department], ["Year", participant.year], ["Participant type", participant.participantType], ["Registration status", participant.registrationStatus], ["Payment status", PARTICIPANT_PAYMENT_STATUSES.find((status) => status.value === participant.paymentStatus)?.label ?? "Not required"], ["Team", teams.find((item) => item.id === participant.teamId)?.name], ["Registration date", typeof participant.registrationDate === "string" ? dateLabel(participant.registrationDate) : "Recorded"]].map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-900">{value || "Not provided"}</dd></div>)}</dl>
  </section></>;

  if (view === "team-new") return <>{header}<div className="mx-auto mt-7 max-w-3xl"><ErrorNotice message={error} /><TeamForm participants={participants.filter((item) => !item.teamId)} saving={saving} onSave={addTeam} onCancel={() => router.push(`/projects/${projectId}/event/teams`)} /></div></>;
  if (view === "schedule-new") return <>{header}<div className="mx-auto mt-7 max-w-3xl"><ErrorNotice message={error} /><ScheduleItemForm project={project} saving={saving} onSave={addScheduleItem} onCancel={() => router.push(`/projects/${projectId}/event/schedule`)} /></div></>;

  if (view === "participants") return <>{header}<section className="mt-7"><SectionHeading title="Participants" description="Manage people registered for this event." action={<Link href={`/projects/${projectId}/event/participants/new`} className={button}><Plus aria-hidden="true" className="size-4" />Add Participant</Link>} /><ErrorNotice message={error} /><div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{[
    ["Total", participants.length],
    ["Confirmed", participants.filter((item) => item.registrationStatus === "confirmed").length],
    ["Waitlisted", participants.filter((item) => item.registrationStatus === "waitlisted").length],
    ["Attended", participants.filter((item) => item.registrationStatus === "attended").length],
    ["Pending payment", participants.filter((item) => item.paymentStatus === "pending").length],
  ].map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-white p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-slate-950">{value}</p></div>)}</div>
  <div className={`${card} mb-4`}>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="relative sm:col-span-2 lg:col-span-2"><span className="sr-only">Search participants</span><Search aria-hidden="true" className="absolute left-3 top-3 size-4 text-slate-400" /><input className={`${input} w-full pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search participants…" /></label>
      <label><span className="sr-only">Registration status</span><select className={`${input} w-full`} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option>{REGISTRATION_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label><span className="sr-only">Team filter</span><select className={`${input} w-full`} value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}><option value="">All teams</option>{teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label><span className="sr-only">Payment status</span><select className={`${input} w-full`} value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}><option value="">All payment statuses</option>{PARTICIPANT_PAYMENT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="sm:col-span-2 lg:col-span-2"><span className="sr-only">College or organization</span><select className={`${input} w-full`} value={organizationFilter} onChange={(event) => setOrganizationFilter(event.target.value)}><option value="">All colleges / organizations</option>{[...new Set(participants.flatMap((item) => [item.college, item.organization].filter((value): value is string => Boolean(value))))].sort().map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    </div>
  </div>
  {filteredParticipants.length ? <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
    <div className="hidden overflow-x-auto md:block"><table className="min-w-[850px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Name", "Email", "College / Organization", "Status", "Team", "Payment", "Registered", "Actions"].map((item) => <th key={item} scope="col" className="px-4 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-border">{filteredParticipants.map((item) => <tr key={item.id} className="align-middle"><th scope="row" className="px-4 py-3 font-medium text-slate-900">{item.name}</th><td className="px-4 py-3">{item.email}</td><td className="px-4 py-3">{item.college || item.organization || "—"}</td><td className="px-4 py-3">{REGISTRATION_STATUSES.find((status) => status.value === item.registrationStatus)?.label}</td><td className="px-4 py-3">{teams.find((team) => team.id === item.teamId)?.name || "—"}</td><td className="px-4 py-3">{PARTICIPANT_PAYMENT_STATUSES.find((status) => status.value === item.paymentStatus)?.label || "Not required"}</td><td className="px-4 py-3">{typeof item.registrationDate === "string" ? dateLabel(item.registrationDate) : "Recorded"}</td><td className="px-4 py-3"><Link className="font-medium text-brand hover:underline" href={`/projects/${projectId}/event/participants/${item.id}`}>View</Link></td></tr>)}</tbody></table></div>
    <ul className="divide-y divide-border md:hidden">{filteredParticipants.map((item) => <li key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-slate-900">{item.name}</p><a className="mt-1 block break-all text-sm text-brand" href={`mailto:${item.email}`}>{item.email}</a><p className="mt-1 text-xs text-slate-500">{item.college || item.organization || "No college or organization"}</p></div><Link aria-label={`View ${item.name}`} className="shrink-0 text-sm font-medium text-brand hover:underline" href={`/projects/${projectId}/event/participants/${item.id}`}>View</Link></div><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{REGISTRATION_STATUSES.find((status) => status.value === item.registrationStatus)?.label}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{teams.find((team) => team.id === item.teamId)?.name || "No team"}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{PARTICIPANT_PAYMENT_STATUSES.find((status) => status.value === item.paymentStatus)?.label || "Not required"}</span></div></li>)}</ul>
  </div> : <div className={`${card} text-center text-sm text-slate-600`}>{participants.length ? "No participants match these filters." : "No participants have been added yet."}</div>}</section></>;

  if (view === "teams") return <>{header}<section className="mt-7"><SectionHeading title="Teams" description="Build teams from participants registered for this event." action={<Link href={`/projects/${projectId}/event/teams/new`} className={button}><Plus aria-hidden="true" className="size-4" />Create Team</Link>} /><ErrorNotice message={error} />{teams.length ? <div className="grid gap-4 lg:grid-cols-2">{teams.map((team) => {
    const members = participants.filter((item) => team.participantIds.includes(item.id));
    const unassigned = participants.filter((item) => !item.teamId);
    return <article key={team.id} className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-slate-950">{team.name}</h3><p className="mt-1 text-sm text-slate-600">{team.description || "No team description."}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-brand">{teamStatusLabel(team.status)}</span></div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3 text-sm"><p className="text-slate-600">Leader <span className="ml-1 font-medium text-slate-900">{participants.find((item) => item.id === team.leaderParticipantId)?.name || "Not set"}</span></p><p className="text-slate-600">Members <span className="ml-1 font-medium text-slate-900">{members.length}</span></p></div>
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-slate-800">Team Members</h4>
        {members.length ? <ul className="mt-2 space-y-2">{members.map((person) => <li key={person.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <div className="min-w-0"><p className="text-sm font-medium text-slate-900">{person.name}{person.id === team.leaderParticipantId ? " · Leader" : ""}</p><p className="truncate text-xs text-slate-500">{person.email}{person.college ? ` · ${person.college}` : ""}</p></div>
          <button
            type="button"
            className="text-xs font-medium text-red-700 hover:underline"
            onClick={() => {
              setConfirmationError("");
              setPendingConfirmation({
                title: `Remove ${person.name} from ${team.name}?`,
                description: "The participant will remain in the event but will no longer belong to this team.",
                confirmLabel: "Remove Member",
                fallbackError: "Member could not be removed.",
                run: async () => {
                  await removeParticipantFromTeam(team.id, person.id, project.id, project.workspaceId, ownerId);
                  await refresh();
                },
              });
            }}
          >Remove</button>
        </li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No team members.</p>}
      </div>
      {unassigned.length > 0 && <AddTeamMember team={team} project={project} ownerId={ownerId} participants={unassigned} onSaved={refresh} onError={setError} />}
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor={`team-status-${team.id}`}>Team status</label>
        <select id={`team-status-${team.id}`} className={input} value={team.status} onChange={(event) => void updateEventTeam(team.id, project.id, project.workspaceId, { status: event.target.value as EventTeam["status"] }, ownerId).then(refresh).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Team status could not be updated."))}>{EVENT_TEAM_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
        <label className="sr-only" htmlFor={`team-leader-${team.id}`}>Set team leader</label>
        <select id={`team-leader-${team.id}`} className={input} value={team.leaderParticipantId || ""} onChange={(event) => void updateEventTeam(team.id, project.id, project.workspaceId, { leaderParticipantId: event.target.value || undefined }, ownerId).then(refresh).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Team leader could not be updated."))}><option value="">No leader</option>{members.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
          onClick={() => {
            setConfirmationError("");
            setPendingConfirmation({
              title: `Delete the team "${team.name}"?`,
              description: "Participants will remain in this event, but this team will be removed.",
              confirmLabel: "Delete Team",
              fallbackError: "Team could not be deleted.",
              run: async () => {
                await deleteEventTeam(team.id, project.id, project.workspaceId, ownerId);
                await refresh();
              },
            });
          }}
        ><Trash2 aria-hidden="true" className="size-4" />Delete</button>
      </div>
    </article>;
  })}</div> : <div className={`${card} text-center`}><UsersRound aria-hidden="true" className="mx-auto size-9 text-slate-400" /><p className="mt-3 text-sm text-slate-600">No teams have been created for this event.</p></div>}</section></>;

  if (view === "schedule") return <>{header}<section className="mt-7">
    <SectionHeading title="Event schedule" description="Schedule sessions, ceremonies, workshops, and other event items." action={<Link href={`/projects/${projectId}/event/schedule/new`} className={button}><Plus aria-hidden="true" className="size-4" />Add Schedule Item</Link>} />
    <ErrorNotice message={error} />
    {schedule.length ? <ol className="space-y-3">{schedule.map((item) => <li key={item.id} className={`${card} flex flex-wrap items-start justify-between gap-4`}>
      <div className="flex min-w-0 gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand"><CalendarDays aria-hidden="true" className="size-5" /></span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-950">{item.title}</p>
          <p className="mt-1 text-sm text-slate-600">{new Date(item.startDateTime).toLocaleString()} – {new Date(item.endDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          {item.location && <p className="mt-1 text-sm text-slate-600">{item.location}</p>}
          {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
          <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{SCHEDULE_ITEM_TYPES.find((type) => type.value === item.type)?.label}</span>
        </div>
      </div>
      <button
        type="button"
        className="text-sm font-medium text-red-700 hover:underline"
        onClick={() => {
          setConfirmationError("");
          setPendingConfirmation({
            title: `Remove "${item.title}" from the event schedule?`,
            description: "This schedule item will be removed from the event.",
            confirmLabel: "Remove Schedule Item",
            fallbackError: "Schedule item could not be removed.",
            run: async () => {
              await deleteScheduleItem(item.id, project.id, project.workspaceId, ownerId);
              await refresh();
            },
          });
        }}
      >Remove</button>
    </li>)}</ol> : <div className={`${card} text-center text-sm text-slate-600`}>No schedule items have been added yet.</div>}
  </section></>;

  return <>{header}<ErrorNotice message={error} />{notice && <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}{notificationWarning && <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notificationWarning}</p>}
    {!details && <section className={`${card} mt-6 border-blue-200 bg-blue-50/50`}><h2 className="text-base font-semibold text-slate-950">Finish setting up this event</h2><p className="mt-1 text-sm text-slate-600">Add event dates, venue, and registration details to start managing participants and the schedule.</p><Link href={`/projects/${projectId}/event/setup`} className={`${button} mt-4`}>Set up event</Link></section>}
    {details && <div className="mt-6 space-y-5">
      <EventSummaryCards participants={participants.length} teams={teams.length} tasks={pendingTasks} requirements={requirements.filter((item) => item.status !== "archived").length} payments={paymentCount} documents={documentCount} />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}><SectionHeading title="Event timeline" /><ol className="space-y-3">{[["Registration opens", details.registrationStartDate], ["Registration closes", details.registrationEndDate], ["Event starts", details.startDate], ["Event ends", details.endDate]].map(([title, date]) => <li key={title} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"><span className="text-sm text-slate-700">{title}</span><span className="text-sm font-medium text-slate-950">{dateLabel(date)}</span></li>)}</ol><div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600"><span>{details.registrationRequired ? "Registration required" : "Registration optional"}</span><span aria-hidden="true">·</span><span>{details.maxParticipants ? `${participants.length} / ${details.maxParticipants} participants` : "No participant limit"}</span></div>{details.maxParticipants && <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.round(participants.length / details.maxParticipants * 100))}%` }} /></div>}</section>
        <section className={card}><SectionHeading title="Event progress" /><div className="space-y-5"><ProgressRow label="Requirements" value={requirements.filter((item) => item.status !== "archived").length ? Math.round(requirements.filter((item) => item.status === "approved").length / requirements.filter((item) => item.status !== "archived").length * 100) : 0} description={`${requirements.filter((item) => item.status === "approved").length} of ${requirements.filter((item) => item.status !== "archived").length} approved`} /><ProgressRow label="Tasks" value={tasks.length ? Math.round(completedTasks / tasks.length * 100) : 0} description={`${completedTasks} of ${tasks.length} complete`} /><ProgressRow label="Participants" value={participants.length ? Math.round(confirmedParticipants / participants.length * 100) : 0} description={`${confirmedParticipants} confirmed or attended`} /><ProgressRow label="Teams" value={teams.length ? Math.round(confirmedTeams / teams.length * 100) : 0} description={`${confirmedTeams} confirmed or completed`} /></div></section>
        <section className={card}><SectionHeading title="Registration summary" action={<Link href={`/projects/${projectId}/event/participants`} className="text-sm font-medium text-brand hover:underline">View participants</Link>} /><dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">{REGISTRATION_STATUSES.slice(0, 4).map((status) => <div key={status.value} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">{status.label}</dt><dd className="mt-1 text-xl font-semibold text-slate-950">{participants.filter((item) => item.registrationStatus === status.value).length}</dd></div>)}</dl><div className="mt-5"><p className="text-sm font-medium text-slate-800">Capacity</p><p className="mt-1 text-sm text-slate-600">{details.maxParticipants ? `${participants.length} / ${details.maxParticipants} participants` : "No participant limit"}</p></div></section>
        <section className={card}><SectionHeading title="Upcoming event tasks" action={<Link href={`/projects/${projectId}/tasks`} className="text-sm font-medium text-brand hover:underline">View tasks</Link>} />{tasks.filter((task) => task.dueDate && task.status !== "completed").sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")).slice(0, 4).length ? <ul className="space-y-3">{tasks.filter((task) => task.dueDate && task.status !== "completed").sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")).slice(0, 4).map((task) => <li key={task.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0"><Link className="min-w-0 truncate text-sm font-medium text-slate-900 hover:text-brand" href={`/projects/${projectId}/tasks/${encodeURIComponent(task.id)}`}>{task.title}</Link><span className="shrink-0 text-xs text-slate-500">{dateLabel(task.dueDate)}</span></li>)}</ul> : <p className="text-sm text-slate-600">No dated upcoming tasks.</p>}</section>
      </div>
      <section className={card}><SectionHeading title="Recent activity" action={<Link href={`/activity?projectId=${encodeURIComponent(projectId)}`} className="text-sm font-medium text-brand hover:underline">View all activity</Link>} /><RecentActivity workspaceId={profile?.workspaceId} projectId={projectId} limit={5} /></section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Participants", `/projects/${projectId}/event/participants`],
        ["Teams", `/projects/${projectId}/event/teams`],
        ["Schedule", `/projects/${projectId}/event/schedule`],
        ["Calendar", `/projects/${projectId}/calendar`],
        ["Requirements", `/projects/${projectId}/requirements`],
        ["Tasks", `/projects/${projectId}/tasks`],
        ["Changes", `/projects/${projectId}/changes`],
        ["Documents", `/projects/${projectId}/documents`],
        ["Payments", `/projects/${projectId}/payments`],
        ["People", `/projects/${projectId}/people`],
      ].map(([label, href]) => <Link key={label} href={href} className={`${secondary} justify-between`}>{label}<ExternalLink aria-hidden="true" className="size-4" /></Link>)}</div>
    </div>}
  </>;
}

function AddTeamMember({ team, project, ownerId, participants, onSaved, onError }: { team: EventTeam; project: Project; ownerId: string; participants: EventParticipant[]; onSaved: () => Promise<void>; onError: (message: string) => void }) {
  const [participantId, setParticipantId] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!participantId) return;
    setBusy(true);
    try {
      await updateEventTeam(team.id, project.id, project.workspaceId, { participantIds: [...team.participantIds, participantId] }, ownerId);
      setParticipantId("");
      await onSaved();
    } catch (caught) { onError(caught instanceof Error ? caught.message : "Participant could not be added to the team."); }
    finally { setBusy(false); }
  };
  return <form onSubmit={add} className="mt-3 flex flex-wrap gap-2"><label className="sr-only" htmlFor={`add-member-${team.id}`}>Add participant to {team.name}</label><select id={`add-member-${team.id}`} className={`${input} min-w-0 flex-1`} value={participantId} onChange={(event) => setParticipantId(event.target.value)}><option value="">Select an unassigned participant</option>{participants.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><button type="submit" className={secondary} disabled={!participantId || busy}><Plus aria-hidden="true" className="size-4" />{busy ? "Adding…" : "Add member"}</button></form>;
}
