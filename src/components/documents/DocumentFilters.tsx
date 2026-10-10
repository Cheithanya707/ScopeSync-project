"use client";

import { DOCUMENT_FILE_TYPES, DOCUMENT_SORT_OPTIONS, type DocumentSort } from "@/lib/constants/documents";
import type { DocumentFileType, Project } from "@/types";

export function DocumentFilters({
  fileType,
  projectId,
  sort,
  onFileTypeChange,
  onProjectChange,
  onSortChange,
  projects,
  workspace,
}: {
  fileType: DocumentFileType | "all";
  projectId: string;
  sort: DocumentSort;
  onFileTypeChange: (value: DocumentFileType | "all") => void;
  onProjectChange: (value: string) => void;
  onSortChange: (value: DocumentSort) => void;
  projects: Project[];
  workspace: boolean;
}) {
  const select = "h-10 min-w-0 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <label className="sr-only" htmlFor="document-type-filter">File type</label><select id="document-type-filter" className={select} value={fileType} onChange={(event) => onFileTypeChange(event.target.value as DocumentFileType | "all")}><option value="all">All file types</option>{DOCUMENT_FILE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select>
    {workspace && <><label className="sr-only" htmlFor="document-project-filter">Project</label><select id="document-project-filter" className={select} value={projectId} onChange={(event) => onProjectChange(event.target.value)}><option value="all">All Projects</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></>}
    <label className="sr-only" htmlFor="document-sort">Sort documents</label><select id="document-sort" className={select} value={sort} onChange={(event) => onSortChange(event.target.value as DocumentSort)}>{DOCUMENT_SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
  </div>;
}
