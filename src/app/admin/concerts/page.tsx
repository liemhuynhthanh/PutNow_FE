"use client";

import { Plus, Ticket } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState } from "@/components/page-state";
import { Skeleton } from "@/components/ui/skeleton";
import { concertsApi } from "@/features/concerts/api";
import { errorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";

export default function AdminConcertsPage() {
  const query = useQuery({ queryKey: ["admin-concerts"], queryFn: () => concertsApi.list({ page: 0, size: 100 }) });
  const concerts = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Concerts</h1><p className="mt-2 text-muted-foreground">Review published shows and ticket inventory.</p></div>
        <Button asChild><Link href="/admin/concerts/new"><Plus />New concert</Link></Button>
      </div>
      <div className="mt-8">
        {query.isPending ? <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-2xl" />)}</div> : query.isError ? <ErrorState message={errorMessage(query.error)} retry={() => query.refetch()} /> : !concerts.length ? <EmptyState title="No concerts" description="Create the first concert to begin selling tickets." /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {concerts.map((concert) => <Card key={concert.id}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">#{concert.id}</p><h2 className="mt-1 text-lg font-semibold">{concert.title}</h2></div><StatusBadge status={concert.status} /></div><p className="mt-3 text-sm text-muted-foreground">{formatDateTime(concert.startTime)}</p><Button className="mt-5" size="sm" variant="outline" asChild><Link href={`/admin/concerts/${concert.id}`}><Ticket />View availability</Link></Button></CardContent></Card>)}
          </div>
        )}
      </div>
    </div>
  );
}
