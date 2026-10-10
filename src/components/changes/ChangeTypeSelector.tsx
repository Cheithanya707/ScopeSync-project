"use client";

import { CHANGE_TYPES } from "@/lib/constants/changes";
import type { ChangeType } from "@/types";

export function ChangeTypeSelector({ value, onChange }: { value: ChangeType; onChange: (value: ChangeType) => void }) {
  return <select id="change-type" value={value} onChange={(event) => onChange(event.target.value as ChangeType)} className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">{CHANGE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>;
}
