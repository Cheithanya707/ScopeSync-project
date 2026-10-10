"use client";

import { CHANGE_SOURCES } from "@/lib/constants/changes";
import type { ChangeSource } from "@/types";

export function ChangeSourceSelector({ value, onChange }: { value: ChangeSource; onChange: (value: ChangeSource) => void }) {
  return <select id="change-source" value={value} onChange={(event) => onChange(event.target.value as ChangeSource)} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">{CHANGE_SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>;
}
