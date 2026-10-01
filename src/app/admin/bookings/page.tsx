"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/page-state";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { bookingKeys, bookingsApi } from "@/features/bookings/api";
import { errorMessage } from "@/lib/api-client";
import { formatDateTime, formatVnd } from "@/lib/format";
import type { Booking } from "@/types/api";

export default function AdminBookingsPage() {
  const [page, setPage] = useState(0);
  const [cancelCandidate, setCancelCandidate] = useState<Booking | null>(null);
  const client = useQueryClient();
  const query = useQuery({ queryKey: bookingKeys.admin(page), queryFn: () => bookingsApi.admin(page) });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "PAID" | "CANCELLED" }) => bookingsApi.updateStatus(id, status),
    onSuccess: async () => {
      setCancelCandidate(null);
      await client.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking status updated.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function requestCancellation(booking: Booking) {
    if (booking.status === "PAID") setCancelCandidate(booking);
    else update.mutate({ id: booking.id, status: "CANCELLED" });
  }

  const bookings = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-4xl font-bold uppercase">Bookings</h1>
      <p className="mt-2 text-muted-foreground">Only valid next-state actions are displayed.</p>
      <div className="mt-8">
        {query.isPending ? <Skeleton className="h-[32rem] rounded-xl" /> : query.isError ? (
          <ErrorState message={errorMessage(query.error)} retry={() => query.refetch()} />
        ) : !bookings.length ? (
          <EmptyState title="No bookings" description="Reservations will appear here when customers book tickets." />
        ) : (
          <>
            <div className="grid gap-4 md:hidden">
              {bookings.map((booking) => (
                <Card key={booking.id}><CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">Booking #{booking.id} · User #{booking.userId}</p><h2 className="mt-1 text-xl font-semibold">{booking.concertTitle}</h2></div><StatusBadge status={booking.status} /></div>
                  <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Total</dt><dd className="font-semibold">{formatVnd(booking.totalAmount)}</dd></div><div><dt className="text-muted-foreground">Expires</dt><dd>{formatDateTime(booking.expiresAt)}</dd></div></dl>
                  <div className="flex flex-wrap gap-2 border-t pt-4">{booking.status === "PENDING" && <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: booking.id, status: "PAID" })}>Mark paid</Button>}{["PENDING", "PAID"].includes(booking.status) && <Button size="sm" variant="destructive" disabled={update.isPending} onClick={() => requestCancellation(booking)}>Cancel</Button>}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card className="hidden md:block"><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Concert</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Expires</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{bookings.map((booking) => <TableRow key={booking.id}><TableCell>#{booking.id}</TableCell><TableCell className="min-w-52 font-medium">{booking.concertTitle}<p className="text-xs text-muted-foreground">User #{booking.userId}</p></TableCell><TableCell><StatusBadge status={booking.status} /></TableCell><TableCell>{formatVnd(booking.totalAmount)}</TableCell><TableCell className="min-w-44">{formatDateTime(booking.expiresAt)}</TableCell><TableCell><div className="flex justify-end gap-2">{booking.status === "PENDING" && <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: booking.id, status: "PAID" })}>Mark paid</Button>}{["PENDING", "PAID"].includes(booking.status) && <Button size="sm" variant="destructive" disabled={update.isPending} onClick={() => requestCancellation(booking)}>Cancel</Button>}</div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
          </>
        )}
        <Pagination page={query.data?.page ?? page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} />
      </div>

      <AlertDialog open={Boolean(cancelCandidate)} onOpenChange={(open) => !open && setCancelCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Cancel this paid booking?</AlertDialogTitle><AlertDialogDescription>Booking #{cancelCandidate?.id} will become cancelled. Its ticket inventory and voucher usage will be restored. This action cannot be reversed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep booking</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={update.isPending} onClick={() => cancelCandidate && update.mutate({ id: cancelCandidate.id, status: "CANCELLED" })}>{update.isPending ? "Cancelling…" : "Cancel booking"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
