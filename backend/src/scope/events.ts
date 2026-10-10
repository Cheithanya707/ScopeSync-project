export type ScopeEvent = {
  type: "audit" | "baseline" | "decision";
  projectId: string;
  at: string;
  action?: string;
  summary?: string;
  entityId?: string;
};

type Listener = (event: ScopeEvent) => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribe(projectId: string, listener: Listener): () => void {
  const set = listeners.get(projectId) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(projectId, set);
  return () => {
    set.delete(listener);
    if (!set.size) listeners.delete(projectId);
  };
}

export function publish(event: ScopeEvent): void {
  for (const listener of listeners.get(event.projectId) ?? []) {
    try {
      listener(event);
    } catch {
      // A broken connection must never stop other viewers from receiving the update.
    }
  }
}

export function subscriberCount(projectId: string): number {
  return listeners.get(projectId)?.size ?? 0;
}
