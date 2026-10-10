"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Monitor, Moon, Sun, Upload, X } from "lucide-react";
import { MemberAvatar } from "@/components/people/MemberAvatar";
import { useAuth } from "@/context/AuthContext";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { ROLE_OPTIONS, WORK_TYPE_OPTIONS, WORKSPACE_TYPE_OPTIONS } from "@/lib/constants";
import { getFriendlyAuthError } from "@/lib/auth";
import { isLocalDataAvailable } from "@/lib/localData";
import { getProjects } from "@/services/projects/projectStore";
import { createActivity } from "@/services/local/activityService";
import { getUserPreferences, updateUserPreferences } from "@/services/local/preferencesService";
import { deleteProfilePhoto, getUserProfile, updateUserProfile, uploadProfilePhoto } from "@/services/local/userService";
import { deleteWorkspaceLogo, updateWorkspace, uploadWorkspaceLogo } from "@/services/local/workspaceService";
import type { Project } from "@/types";
import type { UserProfile } from "@/types/user";

type Section = "profile" | "account" | "workspace" | "preferences" | "appearance" | "security";
const sectionInfo: Record<Section, { title: string; description: string }> = {
  profile: { title: "Profile", description: "Manage your personal information." },
  account: { title: "Account", description: "Review your account details and sign-in information." },
  workspace: { title: "Workspace", description: "Manage the name and identity of your workspace." },
  preferences: { title: "Preferences", description: "Choose defaults that make your workspace feel like yours." },
  appearance: { title: "Appearance", description: "Choose how ScopeSync looks on this device." },
  security: { title: "Security", description: "Manage your sign-in security and account access." },
};

const inputClass = "mt-1.5 block w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-brand";
const labelClass = "block text-sm font-medium text-slate-800";
const primaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-55";
const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-55";

function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function StatusMessage({ message, error = false }: { message: string; error?: boolean }) {
  if (!message) return null;
  return <p role={error ? "alert" : "status"} className={`text-sm ${error ? "text-red-700" : "text-emerald-700"}`}>{message}</p>;
}

function SettingsPageHeader({ section }: { section: Section }) {
  const { title, description } = sectionInfo[section];
  return (
    <header className="mb-6">
      <p className="text-sm font-medium text-brand">Settings</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </header>
  );
}

function PreviewNotice() {
  if (isLocalDataAvailable) return null;
  return <div role="status" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">Standalone preview mode is on. Your account and workspace data are stored only in this browser.</div>;
}

function ProfileSettings() {
  const { user } = useAuth();
  const { profile: workspaceProfile, refresh } = useWorkspace();
  const photoInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(workspaceProfile);
  const [form, setForm] = useState({ displayName: "", primaryRole: "", teamSize: "", workTypes: [] as string[] });
  const [loading, setLoading] = useState(Boolean(user && isLocalDataAvailable));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!user || !isLocalDataAvailable) return;
    void getUserProfile(user.uid).then((data) => {
      if (!active) return;
      setProfile(data);
      setForm({
        displayName: data?.displayName || user.displayName || "",
        primaryRole: data?.primaryRole || "",
        teamSize: data?.teamSize || "",
        workTypes: data?.workTypes || [],
      });
    }).catch(() => {
      if (active) setError("Your profile could not be loaded. Refresh the page and try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  const toggleWorkType = (type: string) => {
    setForm((current) => ({
      ...current,
      workTypes: current.workTypes.includes(type) ? current.workTypes.filter((item) => item !== type) : [...current.workTypes, type],
    }));
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !isLocalDataAvailable) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateUserProfile(user.uid, {
        displayName: form.displayName.trim(),
        primaryRole: form.primaryRole || undefined,
        teamSize: form.teamSize || undefined,
        workTypes: form.workTypes,
      });
      setProfile((current) => current ? { ...current, displayName: form.displayName.trim(), primaryRole: form.primaryRole || undefined, teamSize: form.teamSize || undefined, workTypes: form.workTypes } : current);
      await refresh();
      setMessage("Profile updated successfully.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your profile could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const onPhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user || !isLocalDataAvailable) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const photoURL = await uploadProfilePhoto(file, user.uid);
      await updateUserProfile(user.uid, { photoURL });
      setProfile((current) => current ? { ...current, photoURL } : current);
      await refresh();
      setMessage("Profile photo updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your photo could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!user || !isLocalDataAvailable) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      await deleteProfilePhoto(user.uid);
      await updateUserProfile(user.uid, { photoURL: null });
      setProfile((current) => current ? { ...current, photoURL: undefined } : current);
      await refresh();
      setMessage("Profile photo removed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your photo could not be removed.");
    } finally {
      setUploading(false);
    }
  };

  const currentName = profile?.displayName || user?.displayName || form.displayName || "ScopeSync user";
  const photoURL = profile?.photoURL || user?.photoURL || undefined;
  return (
    <div className="space-y-5">
      <PreviewNotice />
      <SettingsCard title="Profile photo" description="JPG, PNG, or WebP. Maximum file size 5 MB.">
        <div className="flex flex-wrap items-center gap-4">
          <MemberAvatar name={currentName} photoURL={photoURL} size="lg" />
          <div className="flex flex-wrap gap-2">
            <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload profile photo" className="sr-only" onChange={onPhotoSelected} />
            <button type="button" className={secondaryButton} onClick={() => photoInput.current?.click()} disabled={!user || !isLocalDataAvailable || uploading}>
              <Upload aria-hidden="true" className="size-4" /> {uploading ? "Uploading..." : photoURL ? "Change photo" : "Upload photo"}
            </button>
            {photoURL && <button type="button" className={secondaryButton} onClick={removePhoto} disabled={!user || !isLocalDataAvailable || uploading}><X aria-hidden="true" className="size-4" /> Remove photo</button>}
          </div>
        </div>
        <div className="mt-3"><StatusMessage message={message} /><StatusMessage message={error} error /></div>
      </SettingsCard>

      <SettingsCard title="Personal information" description="Your name and work information appear across your workspace.">
        {loading ? <p aria-live="polite" className="animate-pulse text-sm text-slate-500">Loading profile…</p> : (
          <form className="space-y-5" onSubmit={save}>
            <label className={labelClass}>Full name
              <input className={inputClass} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} autoComplete="name" required maxLength={100} disabled={!user || !isLocalDataAvailable} />
            </label>
            <label className={labelClass}>Email
              <input className={inputClass} value={user?.email || profile?.email || "Not signed in"} readOnly aria-readonly="true" />
            </label>
            <label className={labelClass}>Primary role
              <select className={inputClass} value={form.primaryRole} onChange={(event) => setForm({ ...form, primaryRole: event.target.value })} disabled={!user || !isLocalDataAvailable}>
                <option value="">Select a role</option>
                {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className={labelClass}>Team size
              <select className={inputClass} value={form.teamSize} onChange={(event) => setForm({ ...form, teamSize: event.target.value })} disabled={!user || !isLocalDataAvailable}>
                <option value="">Select team size</option>
                {["Just me", "2–5", "6–10", "11–25", "26+"].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <fieldset>
              <legend className={labelClass}>Work types</legend>
              <div className="mt-2 grid max-h-52 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
                {WORK_TYPE_OPTIONS.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.workTypes.includes(type)} onChange={() => toggleWorkType(type)} disabled={!user || !isLocalDataAvailable} className="size-4 accent-brand" />
                    {type}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className={primaryButton} disabled={!user || !profile || !isLocalDataAvailable || saving}>{saving ? "Saving…" : "Save changes"}</button>
              <StatusMessage message={message} />
              <StatusMessage message={error} error />
            </div>
            {!profile && user && isLocalDataAvailable && <p role="status" className="text-sm text-amber-800">A profile record was not found. Complete onboarding before editing profile details.</p>}
          </form>
        )}
      </SettingsCard>
    </div>
  );
}

function AccountSettings() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const { profile } = useWorkspace();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signOut = async () => {
    setBusy(true);
    setError("");
    try {
      await signOutUser();
      router.push("/login");
    } catch {
      setError("You could not be signed out. Please try again.");
      setBusy(false);
    }
  };
  const createdAt = user?.metadata.creationTime;
  return (
    <div className="space-y-5">
      <PreviewNotice />
      <SettingsCard title="Account information">
        <dl className="divide-y divide-border">
          <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]"><dt className="text-sm text-slate-500">Email</dt><dd className="break-all text-sm font-medium text-slate-900">{user?.email || profile?.email || "Not signed in"}</dd></div>
          <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]"><dt className="text-sm text-slate-500">Account created</dt><dd className="text-sm font-medium text-slate-900">{createdAt ? new Date(createdAt).toLocaleDateString() : "Unavailable"}</dd></div>
          <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]"><dt className="text-sm text-slate-500">User ID</dt><dd className="break-all font-mono text-xs text-slate-600">{user?.uid || "Unavailable"}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsCard title="Sign out" description="Sign out of ScopeSync on this device.">
        <button type="button" className={secondaryButton} onClick={signOut} disabled={!user || !isLocalDataAvailable || busy}><span>{busy ? "Signing out…" : "Log out"}</span></button>
        <div className="mt-3"><StatusMessage message={error} error /></div>
      </SettingsCard>
    </div>
  );
}

function WorkspaceSettings() {
  const { user } = useAuth();
  const { profile, workspace, loading: workspaceLoading, refresh } = useWorkspace();
  const logoInput = useRef<HTMLInputElement>(null);
  const [formOverrides, setFormOverrides] = useState<Partial<{ name: string; type: string; description: string }>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activityWarning, setActivityWarning] = useState("");
  const isOwner = Boolean(user && workspace?.ownerId === user.uid);

  const form = {
    name: formOverrides.name ?? workspace?.name ?? "",
    type: formOverrides.type ?? workspace?.type ?? "",
    description: formOverrides.description ?? workspace?.description ?? "",
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspace || !user || !isOwner) return;
    setSaving(true);
    setMessage("");
    setError("");
    setActivityWarning("");
    try {
      const changed = form.name.trim() !== workspace.name || form.type !== workspace.type || (form.description.trim() || "") !== (workspace.description || "");
      await updateWorkspace(workspace.id, { name: form.name.trim(), type: form.type, description: form.description.trim() || undefined });
      await refresh();
      setFormOverrides({});
      setMessage("Workspace settings updated.");
      if (changed && profile) {
        try {
          await createActivity({
            workspaceId: workspace.id,
            actorId: user.uid,
            actorName: profile.displayName || user.displayName || "Workspace member",
            actorPhotoURL: profile.photoURL || user.photoURL || undefined,
            entityType: "workspace",
            entityId: workspace.id,
            entityName: form.name.trim(),
            action: "updated",
            description: `Updated workspace settings for "${form.name.trim()}".`,
          });
        } catch {
          setActivityWarning("Workspace settings were saved, but the activity record could not be synced.");
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Workspace settings could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !workspace || !isOwner) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const logoURL = await uploadWorkspaceLogo(file, workspace.id);
      await updateWorkspace(workspace.id, { logoURL });
      await refresh();
      setMessage("Workspace logo updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Workspace logo could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!workspace || !isOwner) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      await deleteWorkspaceLogo(workspace.id);
      await updateWorkspace(workspace.id, { logoURL: null });
      await refresh();
      setMessage("Workspace logo removed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Workspace logo could not be removed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PreviewNotice />
      <SettingsCard title="Workspace logo" description="JPG, PNG, or WebP. Maximum file size 5 MB.">
        <div className="flex flex-wrap items-center gap-4">
          {workspace?.logoURL ? <Image src={workspace.logoURL} alt={`${workspace.name} logo`} width={56} height={56} unoptimized className="size-14 rounded-xl border border-border object-cover" /> : <div aria-hidden="true" className="flex size-14 items-center justify-center rounded-xl bg-blue-50 text-lg font-semibold text-brand">{workspace?.name?.slice(0, 1).toUpperCase() || "W"}</div>}
          <input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload workspace logo" className="sr-only" onChange={uploadLogo} />
          <button type="button" className={secondaryButton} onClick={() => logoInput.current?.click()} disabled={!isOwner || !isLocalDataAvailable || uploading}><Upload aria-hidden="true" className="size-4" />{uploading ? "Uploading…" : workspace?.logoURL ? "Change logo" : "Upload logo"}</button>
          {workspace?.logoURL && <button type="button" className={secondaryButton} onClick={removeLogo} disabled={!isOwner || !isLocalDataAvailable || uploading}><X aria-hidden="true" className="size-4" />Remove logo</button>}
        </div>
        <div className="mt-3"><StatusMessage message={message} /><StatusMessage message={error} error /></div>
      </SettingsCard>
      <SettingsCard title="Workspace information">
        {workspace ? (
          <form className="space-y-5" onSubmit={save}>
            <label className={labelClass}>Workspace name<input className={inputClass} value={form.name} onChange={(event) => setFormOverrides((current) => ({ ...current, name: event.target.value }))} required maxLength={100} disabled={!isOwner || !isLocalDataAvailable} /></label>
            <label className={labelClass}>Workspace type
              <select className={inputClass} value={form.type} onChange={(event) => setFormOverrides((current) => ({ ...current, type: event.target.value }))} disabled={!isOwner || !isLocalDataAvailable}>
                {WORKSPACE_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className={labelClass}>Description<textarea className={inputClass} value={form.description} onChange={(event) => setFormOverrides((current) => ({ ...current, description: event.target.value }))} rows={4} maxLength={500} disabled={!isOwner || !isLocalDataAvailable} /></label>
            <dl className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Owner</dt><dd className="mt-1 text-sm text-slate-800">{workspace.ownerId === user?.uid ? "You" : "Workspace owner"}</dd></div>
              <div><dt className="text-xs text-slate-500">Created</dt><dd className="mt-1 text-sm text-slate-800">{formatDate(workspace.createdAt)}</dd></div>
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              {isOwner && <button type="submit" className={primaryButton} disabled={!isLocalDataAvailable || saving}>{saving ? "Saving…" : "Save changes"}</button>}
              {!isOwner && <p className="text-sm text-slate-600">Only the workspace owner can change these details.</p>}
              <StatusMessage message={message} /><StatusMessage message={error} error /><StatusMessage message={activityWarning} error />
            </div>
          </form>
        ) : <p aria-live="polite" className="text-sm text-slate-600">{workspaceLoading ? "Loading workspace settings…" : "Workspace information is not available yet."}</p>}
      </SettingsCard>
    </div>
  );
}

function PreferencesSettings() {
  const { user } = useAuth();
  const { profile } = useWorkspace();
  const { compactMode, setCompactMode } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ defaultProjectId: "", defaultCalendarView: "month" as "month" | "week" | "day", defaultTaskView: "list" as "list" | "board", compactMode });
  const [loading, setLoading] = useState(Boolean(user && isLocalDataAvailable));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!user || !profile?.workspaceId || !isLocalDataAvailable) return;
    void Promise.all([getUserPreferences(user.uid), getProjects(user.uid, profile.workspaceId)]).then(([preferences, availableProjects]) => {
      if (!active) return;
      setProjects(availableProjects);
      const selectedProjectExists = availableProjects.some((project) => project.id === preferences?.defaultProjectId);
      setForm({
        defaultProjectId: selectedProjectExists ? preferences?.defaultProjectId || "" : "",
        defaultCalendarView: preferences?.defaultCalendarView || "month",
        defaultTaskView: preferences?.defaultTaskView || "list",
        compactMode: preferences?.compactMode ?? compactMode,
      });
    }).catch(() => {
      if (active) setError("Your preferences could not be loaded. Refresh the page and try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [user, profile?.workspaceId, compactMode]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !isLocalDataAvailable) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateUserPreferences(user.uid, {
        defaultProjectId: form.defaultProjectId || undefined,
        defaultCalendarView: form.defaultCalendarView,
        defaultTaskView: form.defaultTaskView,
        compactMode: form.compactMode,
      });
      setCompactMode(form.compactMode);
      setMessage("Preferences saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your preferences could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div aria-busy="true" className="animate-pulse rounded-xl border border-border bg-white p-6 text-sm text-slate-500">Loading preferences…</div>;
  return (
    <div className="space-y-5">
      <PreviewNotice />
      <SettingsCard title="Workspace defaults">
        <form className="space-y-5" onSubmit={save}>
          <label className={labelClass}>Default project
            <select className={inputClass} value={form.defaultProjectId} onChange={(event) => setForm({ ...form, defaultProjectId: event.target.value })} disabled={!user || !isLocalDataAvailable}>
              <option value="">No default project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>Default calendar view
            <select className={inputClass} value={form.defaultCalendarView} onChange={(event) => setForm({ ...form, defaultCalendarView: event.target.value as "month" | "week" | "day" })} disabled={!user || !isLocalDataAvailable}>
              <option value="month">Month</option><option value="week">Week</option><option value="day">Day</option>
            </select>
          </label>
          <label className={labelClass}>Default task view
            <select className={inputClass} value={form.defaultTaskView} onChange={(event) => setForm({ ...form, defaultTaskView: event.target.value as "list" | "board" })} disabled={!user || !isLocalDataAvailable}>
              <option value="list">List</option><option value="board">Board</option>
            </select>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-border p-4">
            <input type="checkbox" className="mt-0.5 size-4 accent-brand" checked={form.compactMode} onChange={(event) => setForm({ ...form, compactMode: event.target.checked })} disabled={!user || !isLocalDataAvailable} />
            <span><span className="block text-sm font-medium text-slate-900">Compact mode</span><span className="mt-1 block text-sm text-slate-600">Use tighter spacing throughout the application.</span></span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={primaryButton} disabled={!user || !isLocalDataAvailable || saving}>{saving ? "Saving…" : "Save preferences"}</button>
            <StatusMessage message={message} /><StatusMessage message={error} error />
          </div>
        </form>
      </SettingsCard>
      {!isLocalDataAvailable && <p className="text-sm text-slate-500">Preferences are available from the backend when your workspace is configured.</p>}
    </div>
  );
}

function AppearanceSettings() {
  const { mode, setMode } = useTheme();
  const choices: { value: ThemeMode; label: string; description: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", description: "A bright, clear workspace.", icon: Sun },
    { value: "dark", label: "Dark", description: "A darker interface for low-light spaces.", icon: Moon },
    { value: "system", label: "System", description: "Match your device appearance.", icon: Monitor },
  ];
  return (
    <SettingsCard title="Theme" description="Your selection is saved on this device and applies immediately.">
      <div role="group" aria-label="Appearance theme" className="grid gap-3 sm:grid-cols-3">
        {choices.map(({ value, label, description, icon: Icon }) => (
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${mode === value ? "border-brand bg-accent ring-1 ring-brand" : "border-border hover:bg-muted hover:text-foreground"}`}>
            <span className="flex items-center justify-between"><Icon aria-hidden="true" className="size-5 text-brand" />{mode === value && <Check aria-hidden="true" className="size-4 text-brand" />}</span>
            <span className="mt-4 block text-sm font-semibold text-slate-900">{label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-600">{description}</span>
          </button>
        ))}
      </div>
    </SettingsCard>
  );
}

function SecuritySettings() {
  const { user, sendPasswordReset } = useAuth();
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDeleteInfo, setShowDeleteInfo] = useState(false);
  const hasPassword = Boolean(user?.providerData.some((provider) => provider.providerId === "password"));
  const hasGoogle = Boolean(user?.providerData.some((provider) => provider.providerId === "google.com"));

  useEffect(() => {
    const dialog = deleteDialog.current;
    if (!dialog) return;
    if (showDeleteInfo && !dialog.open) dialog.showModal();
    if (!showDeleteInfo && dialog.open) dialog.close();
  }, [showDeleteInfo]);

  const requestReset = async () => {
    if (!user?.email) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await sendPasswordReset(user.email);
      setMessage(`Password reset instructions were sent to ${user.email}.`);
    } catch (caught) {
      setError(getFriendlyAuthError(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PreviewNotice />
      <SettingsCard title="Password" description={hasPassword ? "Request a secure password reset email." : "This account does not use an email and password sign-in."}>
        <button type="button" className={secondaryButton} onClick={requestReset} disabled={!hasPassword || busy || !isLocalDataAvailable}>{busy ? "Sending…" : "Send password reset email"}</button>
        <div className="mt-3"><StatusMessage message={message} /><StatusMessage message={error} error /></div>
      </SettingsCard>
      <SettingsCard title="Google authentication" description="Manage your current sign-in method.">
        <p className="text-sm text-slate-700">Google Authentication <span className={`ml-2 font-medium ${hasGoogle ? "text-emerald-700" : "text-slate-500"}`}>{hasGoogle ? "Connected" : "Not connected"}</span></p>
      </SettingsCard>
      <SettingsCard title="Danger zone" description="Account deletion is permanent. Workspace and project data must be cleaned up safely first.">
        <button type="button" className="inline-flex min-h-10 items-center rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" onClick={() => setShowDeleteInfo(true)}>Delete account</button>
      </SettingsCard>
      <dialog
        ref={deleteDialog}
        aria-labelledby="delete-account-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/50"
        onClose={() => setShowDeleteInfo(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setShowDeleteInfo(false);
        }}
        onCancel={(event) => {
          event.preventDefault();
          setShowDeleteInfo(false);
        }}
      >
            <h2 id="delete-account-title" className="text-lg font-semibold text-slate-950">Delete your account?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">This action is permanent. Account deletion requires additional workspace and project data cleanup configuration, so no account or project data has been deleted.</p>
            <div className="mt-5 flex justify-end">
              <button type="button" autoFocus className={secondaryButton} onClick={() => deleteDialog.current?.close()}>Close</button>
            </div>
      </dialog>
    </div>
  );
}

function formatDate(value: unknown): string {
  if (!value) return "Unavailable";
  const date = value instanceof Date ? value : typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function" ? value.toDate() : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleDateString();
}

export function SettingsPage({ section }: { section: Section }) {
  const content = useMemo(() => {
    switch (section) {
      case "profile": return <ProfileSettings />;
      case "account": return <AccountSettings />;
      case "workspace": return <WorkspaceSettings />;
      case "preferences": return <PreferencesSettings />;
      case "appearance": return <AppearanceSettings />;
      case "security": return <SecuritySettings />;
    }
  }, [section]);

  return <><SettingsPageHeader section={section} />{content}</>;
}
