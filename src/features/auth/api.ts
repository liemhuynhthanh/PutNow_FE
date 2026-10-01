import { ApiError, apiRequest } from "@/lib/api-client";
import type { CurrentUser, UserSummary } from "@/types/api";

export type LoginInput = { name: string; password: string };
export type RegisterInput = { name: string; email: string; password: string; phone?: string };

export const authApi = {
  async me() {
    try {
      return await apiRequest<CurrentUser>("/auth/me", { skipRefresh: false });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  async login(input: LoginInput) {
    return await apiRequest<CurrentUser>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ ...input, platform: "WEB" }),
        skipRefresh: true,
      });
  },
  async register(input: RegisterInput) {
    return await apiRequest<UserSummary>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
        skipRefresh: true,
      });
  },
  async logout() {
    await apiRequest("/auth/logout", { method: "POST", skipRefresh: true });
  },
  async forgotPassword(email: string) {
    return apiRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipRefresh: true,
    });
  },
  async validateResetToken(secretKey: string) {
    return apiRequest<{ message: string }>("/auth/reset-password/validate", {
      method: "POST",
      body: JSON.stringify({ secretKey }),
      skipRefresh: true,
    });
  },
  async resetPassword(secretKey: string, password: string, confirmPassword: string) {
    return apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ secretKey, password, confirmPassword }),
      skipRefresh: true,
    });
  },
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    return apiRequest<{ message: string }>("/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
  },
};
