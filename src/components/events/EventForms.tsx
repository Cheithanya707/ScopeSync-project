"use client";

import { useState, type FormEvent } from "react";
import { EVENT_TYPES, EVENT_TEAM_STATUSES, PARTICIPANT_PAYMENT_STATUSES, REGISTRATION_STATUSES, SCHEDULE_ITEM_TYPES } from "@/lib/constants/events";
import type { EventDetails, EventParticipant, EventScheduleItem, EventTeam, ParticipantPaymentStatus, ParticipantRegistrationStatus, Project, EventScheduleItemType, EventTeamStatus } from "@/types";

const input = "mt-1 block w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60";
const label = "block text-sm font-medium text-slate-800";
const button = "inline-flex min-h-10 items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60";
const secondary = "inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";

function FormFrame({ title, onSubmit, children, error, saving, submitLabel = "Save changes", onCancel }: { title: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: React.ReactNode; error: string; saving: boolean; submitLabel?: string; onCancel: () => void }) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5"><button type="button" className={secondary} onClick={onCancel}>Cancel</button><button type="submit" className={button} disabled={saving}>{saving ? "Saving…" : submitLabel}</button></div>
    </form>
  );
}

function Field({ title, name, value, onChange, type = "text", required = false, maxLength, disabled = false, rows }: { title: string; name: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; maxLength?: number; disabled?: boolean; rows?: number }) {
  const id = `event-field-${name}`;
  return <label htmlFor={id} className={label}>{title}{rows ? <textarea id={id} className={input} value={value} onChange={(event) => onChange(event.target.value)} rows={rows} maxLength={maxLength} disabled={disabled} /> : <input id={id} className={input} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} maxLength={maxLength} disabled={disabled} />}</label>;
}

function SelectField<T extends string>({ title, name, value, options, onChange, disabled = false }: { title: string; name: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; disabled?: boolean }) {
  return <label htmlFor={`event-field-${name}`} className={label}>{title}<select id={`event-field-${name}`} className={input} value={value} onChange={(event) => onChange(event.target.value as T)} disabled={disabled}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export function EventSetupForm({ project, value, saving, onSave, onCancel }: { project: Project; value: EventDetails | null; saving: boolean; onSave: (data: EventDetails) => Promise<void>; onCancel: () => void }) {
  const mappedType = EVENT_TYPES.find((item) => item.projectTypes.includes(project.type))?.value ?? "other";
  const [form, setForm] = useState<EventDetails>(() => value ?? {
    projectId: project.id, workspaceId: project.workspaceId, eventType: mappedType, eventName: project.name,
    registrationRequired: true,
  });
  const [error, setError] = useState("");
  const set = <K extends keyof EventDetails>(key: K, next: EventDetails[K]) => setForm((current) => ({ ...current, [key]: next }));
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!form.eventName.trim()) { setError("Enter an event name."); return; }
    if (form.startDate && form.endDate && form.startDate > form.endDate) { setError("The event end date must be on or after its start date."); return; }
    if (form.registrationEndDate && form.startDate && form.registrationEndDate > form.startDate) { setError("Registration must close on or before the event starts."); return; }
    if (form.maxParticipants !== undefined && (!Number.isInteger(form.maxParticipants) || form.maxParticipants < 1)) { setError("Maximum participants must be a positive whole number."); return; }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) { setError("Enter a valid contact email."); return; }
    for (const [name, value] of [["Website", form.websiteUrl], ["Registration URL", form.registrationUrl]] as const) {
      if (value) {
        try { const url = new URL(value); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); }
        catch { setError(`${name} must be a valid http or https URL.`); return; }
      }
    }
    await onSave({ ...form, eventName: form.eventName.trim() });
  };
  return (
    <FormFrame title="Event details" onSubmit={save} error={error} saving={saving} onCancel={onCancel} submitLabel={value ? "Save event details" : "Create event"}>
      <SelectField title="Event type" name="event-type" value={form.eventType} options={EVENT_TYPES.filter((item) => item.value !== "other").map(({ value, label }) => ({ value, label })).concat([{ value: "other" as const, label: "Other" }])} onChange={(next) => set("eventType", next)} />
      <Field title="Event name" name="event-name" value={form.eventName} required maxLength={140} onChange={(next) => set("eventName", next)} />
      <div className="sm:col-span-2"><Field title="Description" name="description" value={form.shortDescription || ""} maxLength={1000} rows={3} onChange={(next) => set("shortDescription", next || undefined)} /></div>
      <Field title="Venue" name="venue" value={form.venue || ""} onChange={(next) => set("venue", next || undefined)} />
      <Field title="Address" name="address" value={form.address || ""} onChange={(next) => set("address", next || undefined)} />
      <Field title="Start date" name="start-date" type="date" value={form.startDate || ""} onChange={(next) => set("startDate", next || undefined)} />
      <Field title="End date" name="end-date" type="date" value={form.endDate || ""} onChange={(next) => set("endDate", next || undefined)} />
      <Field title="Start time" name="start-time" type="time" value={form.startTime || ""} onChange={(next) => set("startTime", next || undefined)} />
      <Field title="End time" name="end-time" type="time" value={form.endTime || ""} onChange={(next) => set("endTime", next || undefined)} />
      <Field title="Registration opens" name="registration-start" type="date" value={form.registrationStartDate || ""} onChange={(next) => set("registrationStartDate", next || undefined)} />
      <Field title="Registration closes" name="registration-end" type="date" value={form.registrationEndDate || ""} onChange={(next) => set("registrationEndDate", next || undefined)} />
      <Field title="Maximum participants" name="participant-limit" type="number" value={form.maxParticipants?.toString() || ""} onChange={(next) => set("maxParticipants", next ? Number(next) : undefined)} />
      <Field title="Organizer name" name="organizer" value={form.organizerName || ""} onChange={(next) => set("organizerName", next || undefined)} />
      <Field title="Contact email" name="contact-email" type="email" value={form.contactEmail || ""} onChange={(next) => set("contactEmail", next || undefined)} />
      <Field title="Contact phone" name="contact-phone" type="tel" value={form.contactPhone || ""} onChange={(next) => set("contactPhone", next || undefined)} />
      <Field title="Website" name="website" type="url" value={form.websiteUrl || ""} onChange={(next) => set("websiteUrl", next || undefined)} />
      <Field title="Registration URL" name="registration-url" type="url" value={form.registrationUrl || ""} onChange={(next) => set("registrationUrl", next || undefined)} />
      <label className="flex items-center gap-3 text-sm font-medium text-slate-800 sm:col-span-2"><input type="checkbox" className="size-4 accent-brand" checked={form.registrationRequired} onChange={(event) => set("registrationRequired", event.target.checked)} />Registration is required</label>
    </FormFrame>
  );
}

export function ParticipantForm({ value, saving, onSave, onCancel }: { value?: EventParticipant | null; saving: boolean; onSave: (data: Omit<EventParticipant, "id" | "createdAt" | "updatedAt" | "registrationDate" | "projectId" | "workspaceId">) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: value?.name || "", email: value?.email || "", phone: value?.phone || "", college: value?.college || "", organization: value?.organization || "",
    department: value?.department || "", year: value?.year || "", participantType: value?.participantType || "",
    registrationStatus: value?.registrationStatus || "registered" as ParticipantRegistrationStatus,
    paymentStatus: value?.paymentStatus || "not_required" as ParticipantPaymentStatus,
  });
  const [error, setError] = useState("");
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError("Enter a valid email address."); return; }
    try { await onSave({ ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone || undefined, college: form.college || undefined, organization: form.organization || undefined, department: form.department || undefined, year: form.year || undefined, participantType: form.participantType || undefined }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Participant could not be saved."); }
  };
  const set = (key: keyof typeof form, next: string) => setForm((current) => ({ ...current, [key]: next }));
  return (
    <FormFrame title={value ? "Edit participant" : "Add participant"} onSubmit={save} error={error} saving={saving} onCancel={onCancel} submitLabel={value ? "Save participant" : "Add participant"}>
      <Field title="Name" name="participant-name" value={form.name} required maxLength={120} onChange={(next) => set("name", next)} />
      <Field title="Email" name="participant-email" type="email" value={form.email} required maxLength={254} onChange={(next) => set("email", next)} />
      <Field title="Phone" name="participant-phone" type="tel" value={form.phone} onChange={(next) => set("phone", next)} />
      <Field title="College" name="college" value={form.college} onChange={(next) => set("college", next)} />
      <Field title="Organization" name="organization" value={form.organization} onChange={(next) => set("organization", next)} />
      <Field title="Department" name="department" value={form.department} onChange={(next) => set("department", next)} />
      <Field title="Year" name="year" value={form.year} onChange={(next) => set("year", next)} />
      <Field title="Participant type" name="participant-type" value={form.participantType} onChange={(next) => set("participantType", next)} />
      <SelectField title="Registration status" name="registration-status" value={form.registrationStatus} options={REGISTRATION_STATUSES} onChange={(next) => set("registrationStatus", next)} />
      <SelectField title="Payment status" name="payment-status" value={form.paymentStatus} options={PARTICIPANT_PAYMENT_STATUSES} onChange={(next) => set("paymentStatus", next)} />
    </FormFrame>
  );
}

export function TeamForm({ participants, saving, onSave, onCancel }: { participants: EventParticipant[]; saving: boolean; onSave: (data: Omit<EventTeam, "id" | "createdAt" | "updatedAt" | "projectId" | "workspaceId">) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leaderParticipantId, setLeaderParticipantId] = useState("");
  const [status, setStatus] = useState<EventTeamStatus>("forming");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const toggle = (id: string) => setParticipantIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!participantIds.length) { setError("Add at least one participant to this team."); return; }
    if (leaderParticipantId && !participantIds.includes(leaderParticipantId)) { setError("Select the team leader from the chosen team members."); return; }
    try { await onSave({ name: name.trim(), description: description.trim() || undefined, leaderParticipantId: leaderParticipantId || undefined, participantIds, status }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Team could not be created."); }
  };
  return (
    <FormFrame title="Create event team" onSubmit={submit} error={error} saving={saving} onCancel={onCancel} submitLabel="Create team">
      <Field title="Team name" name="team-name" value={name} onChange={setName} required maxLength={120} />
      <SelectField title="Status" name="team-status" value={status} options={EVENT_TEAM_STATUSES} onChange={setStatus} />
      <div className="sm:col-span-2"><Field title="Description" name="team-description" value={description} onChange={setDescription} maxLength={500} rows={3} /></div>
      {participants.length ? <fieldset className="rounded-lg border border-border p-3 sm:col-span-2"><legend className="px-1 text-sm font-medium">Team members</legend><div className="max-h-64 space-y-2 overflow-y-auto">{participants.map((person) => <label key={person.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm"><input type="checkbox" className="size-4 accent-brand" checked={participantIds.includes(person.id)} onChange={() => toggle(person.id)} /><span className="min-w-0"><span className="block font-medium text-slate-800">{person.name}</span><span className="block truncate text-xs text-slate-500">{person.email}</span></span></label>)}</div></fieldset> : <p className="text-sm text-slate-600 sm:col-span-2">Add event participants before creating a team.</p>}
      <SelectField title="Team leader" name="team-leader" value={leaderParticipantId} options={[{ value: "", label: "No leader selected" }, ...participants.filter((person) => participantIds.includes(person.id)).map((person) => ({ value: person.id, label: person.name }))]} onChange={setLeaderParticipantId} />
    </FormFrame>
  );
}

export function ScheduleItemForm({ project, saving, onSave, onCancel }: { project: Project; saving: boolean; onSave: (data: Omit<EventScheduleItem, "id" | "createdAt" | "updatedAt">) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", location: "", startDateTime: "", endDateTime: "", type: "session" as EventScheduleItemType });
  const [error, setError] = useState("");
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.startDateTime || !form.endDateTime || new Date(form.endDateTime) <= new Date(form.startDateTime)) { setError("The end time must be after the start time."); return; }
    try { await onSave({ ...form, projectId: project.id, workspaceId: project.workspaceId, title: form.title.trim(), description: form.description || undefined, location: form.location || undefined }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Schedule item could not be created."); }
  };
  return (
    <FormFrame title="Add schedule item" onSubmit={submit} error={error} saving={saving} onCancel={onCancel} submitLabel="Add schedule item">
      <Field title="Title" name="schedule-title" value={form.title} onChange={(value) => set("title", value)} required maxLength={140} />
      <SelectField title="Type" name="schedule-type" value={form.type} options={SCHEDULE_ITEM_TYPES} onChange={(value) => set("type", value)} />
      <Field title="Location" name="schedule-location" value={form.location} onChange={(value) => set("location", value)} />
      <Field title="Start" name="schedule-start" type="datetime-local" value={form.startDateTime} onChange={(value) => set("startDateTime", value)} required />
      <Field title="End" name="schedule-end" type="datetime-local" value={form.endDateTime} onChange={(value) => set("endDateTime", value)} required />
      <div className="sm:col-span-2"><Field title="Description" name="schedule-description" value={form.description} onChange={(value) => set("description", value)} maxLength={500} rows={3} /></div>
    </FormFrame>
  );
}
