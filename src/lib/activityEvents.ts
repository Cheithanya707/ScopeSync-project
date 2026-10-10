import type { ActivityAction, ActivityEntityType } from "@/types";

export interface ScopeSyncActivityEvent {
  ownerId: string;
  projectId?: string;
  entityType: ActivityEntityType;
  entityId: string;
  entityName: string;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
  assigneeId?: string;
}

const listeners = new Set<(event: ScopeSyncActivityEvent) => Promise<void> | void>();

export async function emitActivityEvent(event: ScopeSyncActivityEvent): Promise<void> {
  await Promise.all([...listeners].map((listener) => listener(event)));
}

export function addActivityEventListener(listener: (event: ScopeSyncActivityEvent) => Promise<void> | void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
