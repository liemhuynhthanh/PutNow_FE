import { CalendarClock, ChevronRight, Ticket } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatVnd } from "@/lib/format";
import type { Booking } from "@/types/api";

export function BookingCard({ booking }: { booking: Booking }) {
  const count = booking.items.reduce((sum, item) => sum + item.quantity, 0);
  return <Link href={`/bookings/${booking.id}`} className="group block"><Card className="transition group-hover:border-primary/40 group-hover:shadow-md"><CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><StatusBadge status={booking.status} /><span className="text-xs text-muted-foreground">Booking #{booking.id}</span></div><h2 className="truncate text-lg font-semibold group-hover:text-primary">{booking.concertTitle}</h2><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Ticket className="size-4" />{count} ticket{count === 1 ? "" : "s"}</span><span className="flex items-center gap-2"><CalendarClock className="size-4" />Expires {formatDateTime(booking.expiresAt)}</span></div></div><div className="flex items-center justify-between gap-5 sm:justify-end"><p className="text-lg font-bold">{formatVnd(booking.totalAmount)}</p><ChevronRight className="text-muted-foreground transition group-hover:translate-x-1" /></div></CardContent></Card></Link>;
}
