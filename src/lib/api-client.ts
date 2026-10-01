import type { ProblemDetail } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly problem?: ProblemDetail,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let csrfPromise: Promise<string> | null = null;
let refreshPromise: Promise<void> | null = null;

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
  return value ? decodeURIComponent(value) : undefined;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => null)) as T | ProblemDetail | null;
  if (!response.ok) {
    const problem = body as ProblemDetail | null;
    throw new ApiError(
      problem?.detail || "Something went wrong. Please try again.",
      response.status,
      problem ?? undefined,
    );
  }
  if (body === null) {
    throw new ApiError("The server returned an invalid response.", response.status);
  }
  return body as T;
}

async function getCsrfToken(force = false) {
  const existing = readCookie("XSRF-TOKEN");
  if (existing && !force) return existing;
  if (!csrfPromise) {
    csrfPromise = fetch(`${API_BASE_URL}/auth/csrf`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => parseResponse<{ token: string }>(response))
      .then((body) => readCookie("XSRF-TOKEN") ?? body.token)
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const token = await getCsrfToken();
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "X-XSRF-TOKEN": token },
      });
      await parseResponse<void>(response);
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RequestOptions = RequestInit & {
  skipRefresh?: boolean;
  skipCsrf?: boolean;
};

export async function apiRequest<T = void>(path: string, options: RequestOptions = {}) {
  const { skipRefresh = false, skipCsrf = false, ...init } = options;
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !skipCsrf) {
    headers.set("X-XSRF-TOKEN", await getCsrfToken());
  }

  const request = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      method,
      headers,
      credentials: "include",
      cache: "no-store",
    });

  let response = await request();
  if (response.status === 401 && !skipRefresh && path !== "/auth/refresh") {
    try {
      await refreshSession();
      response = await request();
    } catch {
      // Keep the original response so callers receive the failure for their request.
    }
  }
  return parseResponse<T>(response);
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
