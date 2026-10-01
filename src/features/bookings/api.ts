import { apiRequest } from "@/lib/api-client";
import type { Booking, PageResponse } from "@/types/api";

export const bookingKeys = {
  all: ["bookings"] as const,
  history: ["bookings", "history"] as const,
  admin: (page: number) => ["bookings", "admin", page] as const,
  detail: (id: number) => ["bookings", "detail", id] as const,
};

export const bookingsApi = {
  async create(input: { concertId: number; items: { ticketTypeId: number; quantity: number }[]; voucherCode?: string; idempotencyKey: string }) {
    return apiRequest<Booking>("/bookings", { method: "POST", body: JSON.stringify(input) });
  },
  async history() {
    return apiRequest<Booking[]>("/bookings");
  },
  async detail(id: number) {
    return apiRequest<Booking>(`/bookings/${id}`);
  },
  admin(page = 0, size = 20) {
    return apiRequest<PageResponse<Booking>>(`/bookings/admin?page=${page}&size=${size}`);
  },
  async updateStatus(id: number, status: "PAID" | "CANCELLED") {
    return apiRequest<Booking>(`/bookings/${id}/status?status=${status}`, { method: "PATCH" });
  },
};
