"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/page-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { concertsApi } from "@/features/concerts/api";
import { errorMessage } from "@/lib/api-client";
import { formatVnd } from "@/lib/format";

export function ConcertAvailabilityView({ id }: { id: number }) {
  const query = useQuery({ queryKey: ["concert-availability", id], queryFn: () => concertsApi.availability(id) });
  if (query.isPending) return <Skeleton className="h-[30rem] rounded-2xl" />;
  if (query.isError) return <ErrorState message={errorMessage(query.error)} retry={() => query.refetch()} />;
  const data = query.data;
  return <div className="mx-auto max-w-5xl"><Button variant="ghost" asChild><Link href="/admin/concerts"><ArrowLeft />Back to concerts</Link></Button><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">{data.title}</h1><p className="mt-2 text-muted-foreground">Ticket availability</p></div><StatusBadge status={data.status} /></div><div className="mt-8 grid gap-4 sm:grid-cols-3">{[{ label: "Total", value: data.totalTickets }, { label: "Sold", value: data.soldTickets }, { label: "Remaining", value: data.remainingTickets }].map((item) => <Card key={item.label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-2 text-3xl font-bold">{item.value}</p></CardContent></Card>)}</div><Card className="mt-6"><CardHeader><CardTitle>Ticket types</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Total</TableHead><TableHead>Remaining</TableHead></TableRow></TableHeader><TableBody>{data.ticketTypeDetails.map((ticket) => <TableRow key={ticket.id}><TableCell className="font-medium">{ticket.name}</TableCell><TableCell>{formatVnd(ticket.price)}</TableCell><TableCell>{ticket.totalQuantity}</TableCell><TableCell>{ticket.remainingQuantity}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div>;
}
