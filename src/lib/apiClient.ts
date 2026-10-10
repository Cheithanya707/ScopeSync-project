import { getFreshFirebaseIdToken } from "@/lib/firebaseClient";

export const LOCAL_USER_KEY = "scopesync.local-user.v1";
export const API_TOKEN_KEY = "scopesync.api-token.v1";
export const AUTH_CHANGE_EVENT = "scopesync:auth-change";

type ApiErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  return (configured || "http://localhost:5000").replace(/\/+$/, "");
}

function clearSessionAfterUnauthorized(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(API_TOKEN_KEY);
  window.localStorage.removeItem(LOCAL_USER_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function resourceUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new ApiError("API paths must be relative to the configured backend URL.", 0, "invalid_api_path");
  }
  return `${apiBaseUrl()}${path}`;
}

async function responseError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload | null = null;
  try {
    payload = await response.json() as ApiErrorPayload;
  } catch {
    payload = null;
  }
  const message = typeof payload?.error?.message === "string"
    ? payload.error.message
    : `The backend request failed (${response.status}).`;
  const code = typeof payload?.error?.code === "string"
    ? payload.error.code
    : "request_failed";
  return new ApiError(message, response.status, code);
}

export async function requestApi<T>(
  path: string,
  init: RequestInit = {},
  options: { authenticated?: boolean; responseType?: "json" | "blob" } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const isMultipart = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isMultipart && init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.authenticated !== false && typeof window !== "undefined") {
    const token = await getFreshFirebaseIdToken() ??
      window.localStorage.getItem(API_TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(resourceUrl(path), { ...init, headers });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Could not reach the ScopeSync API. Make sure the backend is running at the configured API URL.",
      0,
      "network_error",
    );
  }

  if (!response.ok) {
    const error = await responseError(response);
    if (response.status === 401 && options.authenticated !== false) {
      clearSessionAfterUnauthorized();
    }
    throw error;
  }
  if (options.responseType === "blob") return await response.blob() as T;
  if (response.status === 204) return undefined as T;
  try {
    return await response.json() as T;
  } catch {
    throw new ApiError("The backend returned an invalid response.", response.status, "invalid_response");
  }
}

export function requestApiData<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (path === "/api/health" || path.startsWith("/api/auth/") || path.startsWith("/api/public/")) {
    return requestApi<T>(path, init, { authenticated: !path.startsWith("/api/public/") });
  }
  const dataPath = path.replace(/^\/api\//, "/api/data/");
  return requestApi<T>(dataPath, init);
}
