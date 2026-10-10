"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TaskSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search aria-hidden={true} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <Input aria-label="Search tasks" placeholder="Search tasks by title, description, or ID" value={value} onChange={(event) => onChange(event.target.value)} className="pl-9" />
    </div>
  );
}
