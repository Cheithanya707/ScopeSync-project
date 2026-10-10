import type { DocumentFileType } from "@/types";

export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;

export const DOCUMENT_FILE_TYPES: { value: DocumentFileType; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "word", label: "Word" },
  { value: "excel", label: "Excel" },
  { value: "powerpoint", label: "PowerPoint" },
  { value: "image", label: "Image" },
  { value: "text", label: "Text" },
  { value: "archive", label: "Archive" },
  { value: "other", label: "Other" },
];

export const DOCUMENT_ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.csv,.zip";

export const DOCUMENT_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "largest", label: "Largest" },
  { value: "smallest", label: "Smallest" },
] as const;

export type DocumentSort = (typeof DOCUMENT_SORT_OPTIONS)[number]["value"];
