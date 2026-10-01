"use client";

import { Search } from "lucide-react";
import { FormEvent, type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ConcertsView({ initialKeyword, initialStatus, children }: { initialKeyword: string; initialStatus: string; children: ReactNode }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [status, setStatus] = useState(initialStatus);
  function submit(event: FormEvent) {
    event.preventDefault();
    const search = new URLSearchParams();
    if (keyword.trim()) search.set("keyword", keyword.trim());
    if (status) search.set("status", status);
    router.push(`/concerts?${search}`);
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl border-l-4 border-primary pl-5"><p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Live experiences</p><h1 className="mt-1 text-5xl font-bold uppercase sm:text-6xl">Explore concerts</h1><p className="mt-3 text-lg text-muted-foreground">Find your next unforgettable night out.</p></div>
      <form onSubmit={submit} className="my-8 grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-[1fr_220px_auto]">
        <label className="relative"><span className="sr-only">Search concerts</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search by concert name" /></label>
        <select aria-label="Concert status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-lg border bg-card px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/40"><option value="">All statuses</option><option value="UPCOMING">Upcoming</option><option value="ONGOING">Ongoing</option><option value="ENDED">Ended</option><option value="CANCELLED">Cancelled</option></select>
        <Button type="submit">Search</Button>
      </form>
      {children}
    </div>
  );
}
