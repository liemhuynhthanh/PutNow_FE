"use client";

import { type FormEvent, useState } from "react";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState } from "@/components/page-state";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { userKeys, usersApi } from "@/features/admin/api";
import { errorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";

export default function AdminUsersPage() {
  const [input, setInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: userKeys.list(keyword, page), queryFn: () => usersApi.list(keyword, page) });

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setKeyword(input.trim());
  }

  const users = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Users</h1><p className="mt-2 text-muted-foreground">Search and create customer accounts.</p></div>
        <Button asChild><Link href="/admin/users/new"><Plus />New user</Link></Button>
      </div>
      <form onSubmit={search} className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">Search users</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search by name or email" value={input} onChange={(event) => setInput(event.target.value)} /></label>
        <Button type="submit">Search</Button>
      </form>
      <div className="mt-6">
        {query.isPending ? <Skeleton className="h-96 rounded-2xl" /> : query.isError ? <ErrorState message={errorMessage(query.error)} retry={() => query.refetch()} /> : !users.length ? <EmptyState title="No users found" description="Try another search term." /> : (
          <>
            <div className="grid gap-3 md:hidden">
              {users.map((user) => (
                <Card key={user.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{user.name}</p><p className="break-all text-sm text-muted-foreground">{user.email}</p></div><span className="text-xs text-muted-foreground">#{user.id}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Phone</dt><dd className="mt-1">{user.phone || "—"}</dd></div><div><dt className="text-muted-foreground">Created</dt><dd className="mt-1">{user.createdAt ? formatDateTime(user.createdAt) : "—"}</dd></div></dl></CardContent></Card>
              ))}
            </div>
            <Card className="hidden md:block"><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Created</TableHead></TableRow></TableHeader><TableBody>{users.map((user) => <TableRow key={user.id}><TableCell>#{user.id}</TableCell><TableCell className="font-medium">{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.phone || "—"}</TableCell><TableCell>{user.createdAt ? formatDateTime(user.createdAt) : "—"}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
          </>
        )}
        <Pagination page={query.data?.page ?? page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} />
      </div>
    </div>
  );
}
