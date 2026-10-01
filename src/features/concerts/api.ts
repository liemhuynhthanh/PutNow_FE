import { apiRequest } from "@/lib/api-client";
import type { Concert, ConcertAvailability, PageResponse, TicketType } from "@/types/api";

export type ConcertFilters = { keyword?: string; status?: string; page?: number; size?: number };

export const concertKeys = {
  all: ["concerts"] as const,
  list: (filters: ConcertFilters) => ["concerts", "list", filters] as const,
  detail: (id: number) => ["concerts", "detail", id] as const,
  tickets: (id: number) => ["concerts", "tickets", id] as const,
};

export const concertsApi = {
  list(filters: ConcertFilters = {}) {
    const search = new URLSearchParams({
      page: String(filters.page ?? 0),
      size: String(filters.size ?? 12),
      sort: "startTime,asc",
    });
    if (filters.keyword) search.set("keyword", filters.keyword);
    if (filters.status) search.set("status", filters.status);
    return apiRequest<PageResponse<Concert>>(`/concerts?${search}`);
  },
  async detail(id: number) {
    return apiRequest<Concert>(`/concerts/${id}`);
  },
  async tickets(id: number) {
    return apiRequest<TicketType[]>(`/concerts/${id}/ticket-types`);
  },
  async availability(id: number) {
    return apiRequest<ConcertAvailability>(`/concerts/${id}/availability`);
  },
  async create(input: { title: string; description?: string; imageUrl?: string; startTime: string; status: string; ticketTypes: { name: string; price: number; totalQuantity: number }[] }) {
    return apiRequest<Concert>("/concerts", { method: "POST", body: JSON.stringify(input) });
  },
};
