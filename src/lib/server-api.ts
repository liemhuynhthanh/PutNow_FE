import "server-only";

import type { Concert, PageResponse, ProblemDetail, TicketType } from "@/types/api";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080/api/v1";

export class PublicApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "PublicApiError";
  }
}

async function publicRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const body = (await response.json().catch(() => null)) as T | ProblemDetail | null;
  if (!response.ok) {
    const problem = body as ProblemDetail | null;
    throw new PublicApiError(problem?.detail ?? "Unable to load data", response.status);
  }
  if (body === null) throw new PublicApiError("The server returned an invalid response", 502);
  return body as T;
}

export type PublicConcertFilters = {
  keyword?: string;
  status?: string;
  page?: number;
  size?: number;
};

export function getPublicConcerts(filters: PublicConcertFilters = {}) {
  const search = new URLSearchParams({
    page: String(filters.page ?? 0),
    size: String(filters.size ?? 12),
    sort: "startTime,asc",
  });
  if (filters.keyword) search.set("keyword", filters.keyword);
  if (filters.status) search.set("status", filters.status);
  return publicRequest<PageResponse<Concert>>(`/concerts?${search}`);
}

export function getPublicConcert(id: number) {
  return publicRequest<Concert>(`/concerts/${id}`);
}

export function getPublicTicketTypes(id: number) {
  return publicRequest<TicketType[]>(`/concerts/${id}/ticket-types`);
}
