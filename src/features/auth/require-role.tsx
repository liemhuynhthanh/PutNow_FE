"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "./use-session";

export function RequireRole({ children, role }: { children: React.ReactNode; role?: "ADMIN" }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  useEffect(() => {
    if (!session.isPending && !session.data) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!session.isPending && role && session.data?.role !== role) router.replace("/");
  }, [pathname, role, router, session.data, session.isPending]);
  if (session.isPending || !session.data || (role && session.data.role !== role)) return <div className="grid min-h-[50vh] place-items-center"><LoaderCircle className="size-8 animate-spin text-primary" /></div>;
  return children;
}
