import { Archive, File, FileSpreadsheet, FileText, Image as ImageIcon, Presentation, type LucideIcon } from "lucide-react";
import { DOCUMENT_FILE_TYPES, MAX_DOCUMENT_SIZE } from "@/lib/constants/documents";
import type { DocumentFileType } from "@/types";

const fileTypesByExtension: Record<string, DocumentFileType> = {
  pdf: "pdf",
  doc: "word",
  docx: "word",
  xls: "excel",
  xlsx: "excel",
  ppt: "powerpoint",
  pptx: "powerpoint",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  txt: "text",
  csv: "text",
  zip: "archive",
};

const expectedMimePrefixes: Partial<Record<DocumentFileType, string[]>> = {
  pdf: ["application/pdf"],
  word: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  excel: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "application/csv"],
  powerpoint: ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  image: ["image/png", "image/jpeg", "image/webp"],
  text: ["text/plain", "text/csv", "application/csv"],
  archive: ["application/zip", "application/x-zip-compressed"],
};

export function getFileExtension(name: string): string {
  const lastDot = name.lastIndexOf(".");
  return lastDot < 0 ? "" : name.slice(lastDot + 1).toLowerCase();
}

export function getDocumentFileType(fileOrName: File | string): DocumentFileType {
  const name = typeof fileOrName === "string" ? fileOrName : fileOrName.name;
  return fileTypesByExtension[getFileExtension(name)] ?? "other";
}

export function isSupportedDocumentType(file: File): boolean {
  const type = getDocumentFileType(file);
  if (type === "other") return false;
  if (!file.type || file.type === "application/octet-stream") return true;
  return expectedMimePrefixes[type]?.includes(file.type.toLowerCase()) ?? false;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || Number.isInteger(value) ? 0 : 1)} ${units[unitIndex]}`;
}

export function getDocumentTypeLabel(type: DocumentFileType): string {
  return DOCUMENT_FILE_TYPES.find((item) => item.value === type)?.label ?? "Other";
}

export function getDocumentIcon(type: DocumentFileType): LucideIcon {
  switch (type) {
    case "pdf":
    case "word":
    case "text":
      return FileText;
    case "excel":
      return FileSpreadsheet;
    case "powerpoint":
      return Presentation;
    case "image":
      return ImageIcon;
    case "archive":
      return Archive;
    default:
      return File;
  }
}

export function validateDocumentFile(file: File): string | null {
  if (file.size > MAX_DOCUMENT_SIZE) return "File is too large. Maximum file size is 50 MB.";
  if (!isSupportedDocumentType(file)) return "This file type isn't supported.";
  return null;
}

export function sanitizeStorageFileName(name: string): string {
  const safeName = name
    .normalize("NFKC")
    .replace(/[\\/]+/g, "_")
    .replace(/\.\.+/g, "_")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^[-.]+/, "")
    .slice(0, 120);
  return safeName || "document";
}

export function canOpenInBrowser(type: DocumentFileType): boolean {
  return type === "pdf" || type === "image" || type === "text";
}

export function getMaximumDocumentSize(): number {
  return MAX_DOCUMENT_SIZE;
}
