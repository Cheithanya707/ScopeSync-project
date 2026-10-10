"use client";

import { CHANGE_PRIORITIES, CHANGE_SOURCES, CHANGE_STATUSES, CHANGE_TYPES } from "@/lib/constants/changes";
import type { ChangePriority, ChangeSource, ChangeStatus, ChangeType } from "@/types";

export interface ChangeFilterValues {
  status: ChangeStatus | "all";
  type: ChangeType | "all";
  priority: ChangePriority | "all";
  source: ChangeSource | "all";
  sort: "updated" | "newest" | "oldest" | "priority" | "requested" | "alphabetical";
}

export function ChangeFilters({ value, onChange }: { value: ChangeFilterValues; onChange: (value: ChangeFilterValues) => void }) {
  const selectClass = "h-10 min-w-0 rounded-lg border border-input bg-white px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap">
    <label className="sr-only" htmlFor="change-filter-status">Filter by status</label><select id="change-filter-status" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as ChangeFilterValues["status"] })} className={selectClass}><option value="all">All statuses</option>{CHANGE_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <label className="sr-only" htmlFor="change-filter-type">Filter by type</label><select id="change-filter-type" value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value as ChangeFilterValues["type"] })} className={selectClass}><option value="all">All types</option>{CHANGE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <label className="sr-only" htmlFor="change-filter-priority">Filter by priority</label><select id="change-filter-priority" value={value.priority} onChange={(event) => onChange({ ...value, priority: event.target.value as ChangeFilterValues["priority"] })} className={selectClass}><option value="all">All priorities</option>{CHANGE_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <label className="sr-only" htmlFor="change-filter-source">Filter by source</label><select id="change-filter-source" value={value.source} onChange={(event) => onChange({ ...value, source: event.target.value as ChangeFilterValues["source"] })} className={selectClass}><option value="all">All sources</option>{CHANGE_SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <label className="sr-only" htmlFor="change-sort">Sort changes</label><select id="change-sort" value={value.sort} onChange={(event) => onChange({ ...value, sort: event.target.value as ChangeFilterValues["sort"] })} className={selectClass}><option value="updated">Recently Updated</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="priority">Priority</option><option value="requested">Requested Date</option><option value="alphabetical">Alphabetical</option></select>
  </div>;
}
