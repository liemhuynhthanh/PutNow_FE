"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi } from "./api";

export const sessionKey = ["session"] as const;

export function useSession() {
  return useQuery({ queryKey: sessionKey, queryFn: authApi.me, retry: false });
}
