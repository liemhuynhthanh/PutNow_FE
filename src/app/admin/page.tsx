"use client";

import { CalendarDays, ReceiptText, Tags, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingsApi } from "@/features/bookings/api";
import { concertsApi } from "@/features/concerts/api";
import { usersApi, vouchersApi } from "@/features/admin/api";
import { errorMessage } from "@/lib/api-client";
import { ErrorState } from "@/components/page-state";

export default function AdminOverviewPage() {
  const concerts = useQuery({ queryKey: ["admin-overview", "concerts"], queryFn: () => concertsApi.list({ page: 0, size: 1 }) });
  const bookings = useQuery({ queryKey: ["admin-overview", "bookings"], queryFn: () => bookingsApi.admin(0, 1) });
  const users = useQuery({ queryKey: ["admin-overview", "users"], queryFn: () => usersApi.list("", 0, 1) });
  const vouchers = useQuery({ queryKey: ["admin-overview", "vouchers"], queryFn: () => vouchersApi.list(0, 1) });
  const queries = [concerts, bookings, users, vouchers];
  const failed = queries.find((query) => query.isError);
  const cards = [
    { label: "Concerts", value: concerts.data?.totalItems, icon: CalendarDays, href: "/admin/concerts" },
    { label: "Bookings", value: bookings.data?.totalItems, icon: ReceiptText, href: "/admin/bookings" },
    { label: "Users", value: users.data?.totalItems, icon: UsersRound, href: "/admin/users" },
    { label: "Vouchers", value: vouchers.data?.totalItems, icon: Tags, href: "/admin/vouchers" },
  ];
  return <div className="mx-auto max-w-7xl"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">PutNow operations</p><h1 className="mt-2 text-3xl font-bold">Overview</h1><p className="mt-2 text-muted-foreground">Live totals from the existing management endpoints.</p></div>{failed && <div className="mt-6"><ErrorState message={errorMessage(failed.error)} retry={() => queries.forEach((query) => query.refetch())} /></div>}<div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, href }) => <Link href={href} key={label}><Card className="h-full transition hover:border-primary/40 hover:shadow-md"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span></CardHeader><CardContent><p className="text-3xl font-bold">{value ?? "—"}</p><p className="mt-2 text-xs text-muted-foreground">Open management</p></CardContent></Card></Link>)}</div></div>;
}
