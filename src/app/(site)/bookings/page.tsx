"use client";

import { useQuery } from "@tanstack/react-query";
import { BookingCard } from "@/features/bookings/booking-card";
import { bookingKeys, bookingsApi } from "@/features/bookings/api";
import { EmptyState, ErrorState } from "@/components/page-state";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api-client";

export default function BookingHistoryPage() {
  const query = useQuery({ queryKey: bookingKeys.history, queryFn: bookingsApi.history });
  return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Your account</p><h1 className="mt-2 text-4xl font-bold">My bookings</h1><p className="mt-3 text-muted-foreground">Review every reservation and its current status.</p><div className="mt-8 space-y-4">{query.isPending ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />) : query.isError ? <ErrorState message={errorMessage(query.error)} retry={() => query.refetch()} /> : query.data.length ? query.data.map((booking) => <BookingCard key={booking.id} booking={booking} />) : <EmptyState title="No bookings yet" description="Choose a concert and reserve your first tickets." />}</div></div>;
}
