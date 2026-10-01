"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Clock3, ReceiptText } from "lucide-react";
import { bookingKeys, bookingsApi } from "@/features/bookings/api";
import { ErrorState } from "@/components/page-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api-client";
import { formatDateTime, formatVnd } from "@/lib/format";

export function BookingDetail({ id }: { id: number }) {
  const query = useQuery({ queryKey: bookingKeys.detail(id), queryFn: () => bookingsApi.detail(id), enabled: Number.isFinite(id) });
  if (query.isPending) return <div className="mx-auto max-w-3xl px-4 py-12"><Skeleton className="h-[32rem] rounded-2xl" /></div>;
  if (query.isError) return <div className="mx-auto max-w-3xl px-4 py-12"><ErrorState message={errorMessage(query.error)} retry={() => query.refetch()} /></div>;
  const booking = query.data;
  return <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><Button variant="ghost" asChild><Link href="/bookings"><ArrowLeft />Back to bookings</Link></Button><Card className="mt-5"><CardHeader className="border-b"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">Booking #{booking.id}</p><CardTitle className="mt-1 text-2xl">{booking.concertTitle}</CardTitle></div><StatusBadge status={booking.status} /></div></CardHeader><CardContent className="space-y-6 p-6"><div className="flex items-start gap-3 rounded-xl bg-muted p-4"><Clock3 className="mt-0.5 text-primary" /><div><p className="font-medium">Reservation expires</p><p className="text-sm text-muted-foreground">{formatDateTime(booking.expiresAt)} (Vietnam time)</p></div></div><div><h2 className="mb-3 flex items-center gap-2 font-semibold"><ReceiptText className="size-5 text-primary" />Ticket summary</h2><div className="space-y-3">{booking.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><div><p className="font-medium">{item.ticketTypeName}</p><p className="text-muted-foreground">{item.quantity} × {formatVnd(item.price)}</p></div><p className="font-medium">{formatVnd(item.subTotal)}</p></div>)}</div></div><Separator /><div className="space-y-2 text-sm">{booking.voucherCode && <div className="flex justify-between text-muted-foreground"><span>Voucher ({booking.voucherCode})</span><span>−{formatVnd(booking.discountAmount ?? 0)}</span></div>}<div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatVnd(booking.totalAmount)}</span></div></div></CardContent></Card></div>;
}
