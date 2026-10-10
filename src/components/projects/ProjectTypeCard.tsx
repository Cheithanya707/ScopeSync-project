"use client";

import {
  BarChart3, Building2, Camera, Code2, FileText, FolderKanban, Globe2, GraduationCap,
  Lightbulb, Megaphone, Palette, PenTool, Presentation, School, Share2, Smartphone,
  Users, Video,
} from "lucide-react";
import type { ComponentType } from "react";
import { PROJECT_TYPES } from "@/lib/constants";
import type { ProjectType } from "@/types";

const icons: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  code: Code2, globe: Globe2, smartphone: Smartphone, "pen-tool": PenTool, palette: Palette,
  video: Video, camera: Camera, "file-text": FileText, megaphone: Megaphone, "share-2": Share2,
  "chart-no-axes-column-increasing": BarChart3, "graduation-cap": GraduationCap, school: School,
  lightbulb: Lightbulb, presentation: Presentation, users: Users, "building-2": Building2,
  "folder-kanban": FolderKanban,
};

type Props = { value: ProjectType; selected: boolean; onSelect: (value: ProjectType) => void };

export function ProjectTypeCard({ value, selected, onSelect }: Props) {
  const projectType = PROJECT_TYPES.find((item) => item.value === value);
  if (!projectType) return null;
  const Icon = icons[projectType.icon];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      className={`flex min-h-36 flex-col items-start rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        selected ? "border-brand bg-blue-50/70 ring-1 ring-brand" : "border-border bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span className={`mb-3 flex size-9 items-center justify-center rounded-lg ${selected ? "bg-white text-brand" : "bg-slate-100 text-slate-600"}`}>
        <Icon aria-hidden={true} className="size-5" />
      </span>
      <span className="font-medium text-slate-900">{projectType.label}</span>
      <span className="mt-1 text-sm leading-5 text-muted-foreground">{projectType.description}</span>
    </button>
  );
}
