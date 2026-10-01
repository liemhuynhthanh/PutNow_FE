import { apiRequest } from "@/lib/api-client";
import type { ImageUpload, PageResponse, UserSummary, Voucher } from "@/types/api";

export const userKeys = { list: (keyword: string, page: number) => ["users", keyword, page] as const };
export const voucherKeys = { list: (page: number) => ["vouchers", page] as const };

export const usersApi = {
  list(keyword = "", page = 0, size = 20) {
    const search = new URLSearchParams({ keyword, page: String(page), size: String(size), sort: "id,asc" });
    return apiRequest<PageResponse<UserSummary>>(`/users?${search}`);
  },
  async create(input: { name: string; email: string; phone?: string; password: string }) {
    return apiRequest<UserSummary>("/users", { method: "POST", body: JSON.stringify(input) });
  },
};

export const vouchersApi = {
  list(page = 0, size = 20) { return apiRequest<PageResponse<Voucher>>(`/vouchers?page=${page}&size=${size}`); },
  async create(input: { code: string; discountType: "PERCENTAGE" | "FIXED_AMOUNT"; discountValue: number; maxUses: number; expiredAt: string }) {
    return apiRequest<Voucher>("/vouchers", { method: "POST", body: JSON.stringify(input) });
  },
};

export const mediaApi = {
  async upload(file: File) {
    const form = new FormData();
    form.set("file", file);
    return apiRequest<ImageUpload>("/media/images", { method: "POST", body: form });
  },
};
