import { Archive, File, FileSpreadsheet, FileText, Image as ImageIcon, Presentation } from "lucide-react";
import type { DocumentFileType } from "@/types";

export function DocumentFileIcon({ type, className = "size-5" }: { type: DocumentFileType; className?: string }) {
  const props = { className };
  let icon;
  switch (type) {
    case "pdf":
    case "word":
    case "text":
      icon = <FileText {...props} />;
      break;
    case "excel":
      icon = <FileSpreadsheet {...props} />;
      break;
    case "powerpoint":
      icon = <Presentation {...props} />;
      break;
    case "image":
      icon = <ImageIcon {...props} />;
      break;
    case "archive":
      icon = <Archive {...props} />;
      break;
    default:
      icon = <File {...props} />;
  }
  return <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">{icon}</span>;
}
