"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Sparkles, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectCategorySelector, ProjectKindSelector } from "@/components/projects/ProjectCategorySelector";
import { ProjectForm, emptyProjectForm } from "@/components/projects/ProjectForm";
import { ProjectPlanPreview } from "@/components/projects/ProjectPlanPreview";
import { ProjectReview } from "@/components/projects/ProjectReview";
import { ProjectStepIndicator } from "@/components/projects/ProjectStepIndicator";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getProjectTypeForSelection,
  isEventProjectCategory,
  PROJECT_CATEGORIES,
  type ProjectKind,
} from "@/lib/constants/projectCatalog";
import { validateProjectForm, type ProjectFormErrors } from "@/lib/projectValidation";
import { createProject } from "@/services/projects/projectStore";
import type { ProjectAIPlan, ProjectFormValues } from "@/types";

type ProjectPath = {
  kind: ProjectKind | "";
  categoryId: string;
  subcategory: string;
};

type ProjectIntake = {
  venue: string;
  expectedAttendees: string;
  food: string;
  stageEquipment: string;
  schedule: string;
  accessibilitySafety: string;
  deliverables: string;
  tools: string;
  audience: string;
  providedAccess: string;
  additionalRequirements: string;
};

const steps = ["Project path", "Category", "Details", "AI plan", "Review", "Create"];
const emptyIntake: ProjectIntake = {
  venue: "",
  expectedAttendees: "",
  food: "",
  stageEquipment: "",
  schedule: "",
  accessibilitySafety: "",
  deliverables: "",
  tools: "",
  audience: "",
  providedAccess: "",
  additionalRequirements: "",
};

function isEventMode(path: ProjectPath): boolean {
  return path.kind === "personal" && isEventProjectCategory(path.categoryId, path.subcategory);
}

function makePlanningBrief(
  path: ProjectPath,
  values: ProjectFormValues,
  intake: ProjectIntake,
  categoryName: string,
): string {
  const fields = [
    ["Project purpose and description", values.description],
    ["Start date", values.startDate],
    ["Expected end date", values.deadline],
    ["Client, school, or organizer", values.clientName],
    ["Budget", values.budget ? `${values.currency} ${values.budget}` : ""],
    ["Venue", intake.venue],
    ["Expected attendees or participants", intake.expectedAttendees],
    ["Food and catering", intake.food],
    ["Stage, equipment, and technical setup", intake.stageEquipment],
    ["Schedule or program", intake.schedule],
    ["Accessibility, safety, and contingency", intake.accessibilitySafety],
    ["Deliverables and acceptance expectations", intake.deliverables],
    ["Tools, platforms, or materials", intake.tools],
    ["Audience or users", intake.audience],
    ["Access or materials provided", intake.providedAccess],
    ["Additional requirements", intake.additionalRequirements],
  ].filter(([, value]) => value.trim());

  return [
    `Project path: ${path.kind === "personal" ? "Personal project" : "Freelancer project"}`,
    `Category: ${categoryName}`,
    `Project type: ${path.subcategory}`,
    ...fields.map(([label, value]) => `${label}: ${value.trim()}`),
  ].join("\n");
}

function DetailField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={500}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}

function ProjectIntakeFields({
  path,
  value,
  onChange,
}: {
  path: ProjectPath;
  value: ProjectIntake;
  onChange: (next: ProjectIntake) => void;
}) {
  const update = (key: keyof ProjectIntake) => (nextValue: string) => onChange({ ...value, [key]: nextValue });

  if (isEventMode(path)) {
    return (
      <section className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-brand"><CalendarDays aria-hidden="true" className="size-4" /></span>
          <div><h3 className="font-semibold text-foreground">Event planning details</h3><p className="mt-1 text-sm text-muted-foreground">Add what you know now. The AI plan will highlight important details still to confirm.</p></div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="event-venue" className="text-sm font-medium text-foreground">Venue or location</label>
            <div className="relative"><MapPin aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input id="event-venue" className="pl-9" value={value.venue} onChange={(event) => update("venue")(event.target.value)} placeholder="Venue, campus, or address" maxLength={250} /></div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="event-attendees" className="text-sm font-medium text-foreground">Expected attendees / participants</label>
            <div className="relative"><UsersRound aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input id="event-attendees" className="pl-9" value={value.expectedAttendees} onChange={(event) => update("expectedAttendees")(event.target.value)} placeholder="Estimated number or audience" maxLength={160} /></div>
          </div>
          <DetailField id="event-food" label="Food and catering" value={value.food} onChange={update("food")} placeholder="Meals, refreshments, dietary needs, serving times…" />
          <DetailField id="event-stage" label="Stage, equipment, and setup" value={value.stageEquipment} onChange={update("stageEquipment")} placeholder="Stage, sound, lighting, seating, power, AV…" />
          <DetailField id="event-schedule" label="Program or schedule" value={value.schedule} onChange={update("schedule")} placeholder="Activities, performances, sessions, opening and closing…" />
          <DetailField id="event-safety" label="Safety, access, and contingency" value={value.accessibilitySafety} onChange={update("accessibilitySafety")} placeholder="Accessibility, permissions, first aid, weather plan…" />
        </div>
        <div className="mt-4"><DetailField id="event-requirements" label="Other event requirements" value={value.additionalRequirements} onChange={update("additionalRequirements")} placeholder="Suppliers, decorations, volunteers, transport, certificates, cleanup…" rows={4} /></div>
      </section>
    );
  }

  const hasFreelancerPath = path.kind === "freelancer" ||
    (path.kind === "personal" && path.categoryId === "other-freelance-services");
  return (
    <section className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
      <div>
        <h3 className="font-semibold text-foreground">{hasFreelancerPath ? "Work scope and deliverables" : "Personal project details"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Share the expected outcome, constraints, and anything the plan should account for.</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {hasFreelancerPath ? (
          <>
            <DetailField id="project-deliverables" label="Expected deliverables" value={value.deliverables} onChange={update("deliverables")} placeholder="What should be completed or handed over?" />
            <DetailField id="project-tools" label="Tools, platform, or technology" value={value.tools} onChange={update("tools")} placeholder="For example: Next.js, Figma, Shopify, Power BI…" />
            <DetailField id="project-audience" label="Client audience or end users" value={value.audience} onChange={update("audience")} placeholder="Who will use or review the result?" />
            <DetailField id="project-access" label="Available access or materials" value={value.providedAccess} onChange={update("providedAccess")} placeholder="Brand assets, accounts, content, source files, approvals…" />
          </>
        ) : (
          <DetailField id="project-audience" label="Who is this project for?" value={value.audience} onChange={update("audience")} placeholder="Learners, family, community, or another group…" />
        )}
      </div>
      <div className="mt-4"><DetailField id="project-extra-requirements" label="Requirements, constraints, or notes" value={value.additionalRequirements} onChange={update("additionalRequirements")} placeholder="Important needs, resources, dependencies, or success criteria…" rows={4} /></div>
    </section>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const [step, setStep] = useState(1);
  const [path, setPath] = useState<ProjectPath>({ kind: "", categoryId: "", subcategory: "" });
  const [values, setValues] = useState<ProjectFormValues>(emptyProjectForm);
  const [intake, setIntake] = useState<ProjectIntake>(emptyIntake);
  const [plan, setPlan] = useState<ProjectAIPlan | null>(null);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedCategory = useMemo(
    () => path.kind ? PROJECT_CATEGORIES[path.kind].find((category) => category.id === path.categoryId) : undefined,
    [path.categoryId, path.kind],
  );
  const eventMode = isEventMode(path);
  const planningBrief = useMemo(
    () => selectedCategory && path.kind && path.subcategory
      ? makePlanningBrief(path, values, intake, selectedCategory.label)
      : "",
    [intake, path, selectedCategory, values],
  );

  const updatePath = (kind: ProjectKind) => {
    setPath({ kind, categoryId: "", subcategory: "" });
    setValues({ ...values, type: "" });
    setPlan(null);
    setError("");
  };

  const updateCategory = (categoryId: string) => {
    setPath((current) => ({ ...current, categoryId, subcategory: "" }));
    setValues((current) => ({
      ...current,
      name: current.name === path.subcategory ? "" : current.name,
      type: "",
    }));
    setPlan(null);
  };

  const updateSubcategory = (subcategory: string) => {
    if (!path.kind || !selectedCategory) return;
    const nextName = !values.name || values.name === path.subcategory ? subcategory : values.name;
    const type = getProjectTypeForSelection(path.kind, selectedCategory.id, subcategory);
    setPath((current) => ({ ...current, subcategory }));
    setValues((current) => ({ ...current, name: nextName, type }));
    setPlan(null);
    setErrors({});
  };

  const generatePlan = async () => {
    if (!path.kind || !selectedCategory || !path.subcategory) return;
    if (planningBrief.length > 3000) {
      setError("Your project brief is over 3,000 characters. Shorten a few details and try again.");
      return;
    }
    setError("");
    setStep(4);
    setPlan({
      summary: "AI planning is not connected in this standalone frontend. You can create the project and add its plan later.",
      requirements: [],
      steps: [],
      openQuestions: [],
      provider: "rules",
      generatedAt: new Date().toISOString(),
    });
  };

  const next = async () => {
    setError("");
    if (step === 1) {
      if (!path.kind) {
        setError("Choose personal or freelancer project to continue.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!path.categoryId || !path.subcategory) {
        setError("Choose a category and project type to continue.");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      const validation = validateProjectForm(values);
      setErrors(validation);
      if (Object.keys(validation).length) return;
      await generatePlan();
      return;
    }
    if (step === 4 && plan) setStep(5);
  };

  const create = async () => {
    if (!user || !path.kind || !selectedCategory || !plan) {
      setError("Your project details are incomplete. Return to the previous step and try again.");
      return;
    }
    const validation = validateProjectForm(values);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setStep(3);
      return;
    }
    setStep(6);
    setSaving(true);
    setError("");
    try {
      const project = await createProject({
        workspaceId: workspaceId ?? user.uid,
        ownerId: user.uid,
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        type: values.type || "other",
        projectKind: path.kind,
        projectCategory: selectedCategory.label,
        projectSubcategory: path.subcategory,
        planningBrief,
        aiPlan: plan,
        clientName: values.clientName.trim() || undefined,
        startDate: values.startDate || undefined,
        deadline: values.deadline || undefined,
        budget: values.budget ? Number(values.budget) : undefined,
        currency: values.currency,
        status: values.status,
      });
      router.push(`/projects/${project.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the project. Please try again.");
      setStep(5);
    } finally {
      setSaving(false);
    }
  };

  const updateValues = (nextValues: ProjectFormValues) => {
    setValues(nextValues);
    setPlan(null);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/projects" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />Back to projects
      </Link>
      <div className="mt-4 sm:mt-5">
        <p className="text-sm font-medium text-brand">A clear plan starts here</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Create a new project</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Tell ScopeSync what you are organizing. Choose a path, add the details you know, and review a tailored planning draft before creating your workspace.</p>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:mt-7 sm:rounded-3xl sm:p-7">
        <ProjectStepIndicator current={step} steps={steps} />
        <div className="mt-7 sm:mt-8">
          {step === 1 && <ProjectKindSelector value={path.kind} onChange={updatePath} />}
          {step === 2 && path.kind && (
            <ProjectCategorySelector
              kind={path.kind}
              categoryId={path.categoryId}
              subcategory={path.subcategory}
              onChangeCategory={updateCategory}
              onChangeSubcategory={updateSubcategory}
            />
          )}
          {step === 3 && (
            <div>
              {selectedCategory && (
                <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-accent px-3 py-1 font-medium text-accent-foreground">{path.kind === "personal" ? "Personal project" : "Freelancer project"}</span>
                  <span className="text-muted-foreground">{selectedCategory.label} / {path.subcategory}</span>
                </div>
              )}
              <ProjectForm
                values={values}
                onChange={updateValues}
                errors={errors}
                includeType={false}
                startDateLabel={eventMode ? "Event start date" : "Start date"}
                deadlineLabel={eventMode ? "Event end date" : "Expected deadline"}
              />
              <ProjectIntakeFields path={path} value={intake} onChange={setIntake} />
            </div>
          )}
          {step === 4 && !plan && (
            <div role="status" className="rounded-2xl border border-border bg-muted/40 px-5 py-12 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent text-brand"><Sparkles aria-hidden="true" className="size-6 animate-pulse" /></span>
              <p className="mt-4 font-semibold text-foreground">Preparing your project plan…</p>
              <p className="mt-2 text-sm text-muted-foreground">Reviewing your project type, needs, schedule, and requirements.</p>
            </div>
          )}
          {step === 4 && plan && <ProjectPlanPreview plan={plan} />}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Review your project</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your project details and planning draft will be saved to the workspace.</p>
              </div>
              <ProjectReview values={values} />
              <dl className="grid gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted-foreground">Project path</dt><dd className="mt-1 font-medium text-foreground">{path.kind === "personal" ? "Personal project" : "Freelancer project"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Category and project type</dt><dd className="mt-1 font-medium text-foreground">{selectedCategory?.label} · {path.subcategory}</dd></div>
                {planningBrief && <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Planning details</dt><dd className="mt-1 whitespace-pre-wrap text-foreground">{planningBrief}</dd></div>}
              </dl>
              {plan && <ProjectPlanPreview plan={plan} />}
            </div>
          )}
          {step === 6 && (
            <div role="status" className="rounded-2xl border border-border bg-muted/40 px-5 py-12 text-center">
              <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-brand border-r-transparent" aria-hidden="true" />
              <p className="mt-4 font-medium text-foreground">{saving ? "Creating your project…" : "Preparing your workspace…"}</p>
              <p className="mt-2 text-sm text-muted-foreground">Saving your project details and reviewed planning draft.</p>
            </div>
          )}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {errors.type && step === 2 && <p role="alert" className="mt-3 text-sm text-destructive">{errors.type}</p>}
        {step < 6 && (
          <div className="mt-7 flex flex-col-reverse justify-between gap-3 border-t border-border pt-5 sm:flex-row">
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button asChild variant="outline"><Link href="/projects">Cancel</Link></Button>
              {step > 1 && <Button variant="outline" type="button" onClick={() => { setError(""); setStep((current) => current - 1); }}><ArrowLeft aria-hidden="true" />Back</Button>}
            </div>
            {step === 5 ? (
              <Button type="button" onClick={create}>Create Project<ArrowRight aria-hidden="true" /></Button>
            ) : (
              <Button type="button" onClick={next} disabled={step === 4 && !plan}>
                {step === 3 ? "Generate AI plan" : step === 4 ? "Review project" : "Continue"}
                {step !== 3 && <ArrowRight aria-hidden="true" />}
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
