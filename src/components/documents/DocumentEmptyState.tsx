"use client";

import { FilePlus2, Files } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentEmptyState({ workspace, onUpload }: { workspace: boolean; onUpload: () => void }) {
  return <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand"><Files aria-hidden={true} className="size-6" /></span><h2 className="mt-4 text-lg font-semibold text-slate-950">{workspace ? "No documents across this workspace yet" : "No documents yet"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Upload project files such as scope documents, proposals, requirements and reference files.</p><Button type="button" onClick={onUpload} className="mt-5"><FilePlus2 aria-hidden={true} />Upload Document</Button></section>;
}
