import { LOCAL_USER_KEY, requestApiData } from "@/lib/apiClient";
export { LOCAL_USER_KEY } from "@/lib/apiClient";

const LOCAL_DEMO_MODE_KEY = "scopesync.local-demo-mode.v1";
const LOCAL_DEMO_MODE_EVENT = "scopesync:local-demo-mode";

export const isLocalDataAvailable = Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());

export function getIsLocalDemoMode(): boolean {
  return !isLocalDataAvailable &&
    typeof window !== "undefined" &&
    window.localStorage.getItem(LOCAL_DEMO_MODE_KEY) === "true";
}

export function setLocalDemoMode(enabled: boolean): void {
  if (enabled && !isLocalDataAvailable) {
    window.localStorage.setItem(LOCAL_DEMO_MODE_KEY, "true");
  } else {
    window.localStorage.removeItem(LOCAL_DEMO_MODE_KEY);
  }
  window.dispatchEvent(new Event(LOCAL_DEMO_MODE_EVENT));
}

export function subscribeToLocalDemoMode(callback: () => void): () => void {
  window.addEventListener(LOCAL_DEMO_MODE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(LOCAL_DEMO_MODE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export interface DataSource {
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

export function getLocalUserId(): string {
  if (typeof window === "undefined") return "local-preview-user";
  const raw = window.localStorage.getItem(LOCAL_USER_KEY);
  if (!raw) return "local-preview-user";
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === "object" && "uid" in value && typeof value.uid === "string") {
      return value.uid;
    }
  } catch {
    throw new Error("Saved ScopeSync account data could not be read. Sign in again to continue.");
  }
  throw new Error("Saved ScopeSync account data is invalid. Sign in again to continue.");
}

export async function requestApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return requestApiData<T>(path, init);
}

export async function requestLocalData<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return requestApi<T>(path, init);
}

export function createDataSource(): DataSource {
  return {
    request: <T,>(path: string, init: RequestInit = {}) => requestApi<T>(path, init),
  };
}

export async function resolveWorkspaceId(_ownerId: string, workspaceId: string | null | undefined): Promise<string | null> {
  return workspaceId ?? null;
}
