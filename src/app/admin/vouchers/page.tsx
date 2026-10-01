"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/page-state";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { voucherKeys, vouchersApi } from "@/features/admin/api";
import { errorMessage } from "@/lib/api-client";
import { formatDateTime, formatVnd } from "@/lib/format";

export default function AdminVouchersPage() {
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: voucherKeys.list(page), queryFn: () => vouchersApi.list(page) });
  const vouchers = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Vouchers</h1><p className="mt-2 text-muted-foreground">Manage discount campaigns and usage limits.</p></div><Button asChild><Link href="/admin/vouchers/new"><Plus />New voucher</Link></Button></div>
      <div className="mt-8">
        {query.isPending ? <Skeleton className="h-96 rounded-2xl" /> : query.isError ? <ErrorState message={errorMessage(query.error)} retry={() => query.refetch()} /> : !vouchers.length ? <EmptyState title="No vouchers" description="Create a discount campaign for customers." /> : (
          <>
            <div className="grid gap-3 md:hidden">
              {vouchers.map((voucher) => <Card key={voucher.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><p className="font-heading text-xl font-bold uppercase tracking-wide">{voucher.code}</p><p className="font-semibold text-primary">{voucher.discountType === "PERCENTAGE" ? `${voucher.discountValue}%` : formatVnd(voucher.discountValue)}</p></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Usage</dt><dd className="mt-1">{voucher.usedCount} / {voucher.maxUses}</dd></div><div><dt className="text-muted-foreground">Expires</dt><dd className="mt-1">{formatDateTime(voucher.expiredAt)}</dd></div></dl></CardContent></Card>)}
            </div>
            <Card className="hidden md:block"><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Usage</TableHead><TableHead>Expires</TableHead></TableRow></TableHeader><TableBody>{vouchers.map((voucher) => <TableRow key={voucher.id}><TableCell className="font-semibold">{voucher.code}</TableCell><TableCell>{voucher.discountType === "PERCENTAGE" ? `${voucher.discountValue}%` : formatVnd(voucher.discountValue)}</TableCell><TableCell>{voucher.usedCount} / {voucher.maxUses}</TableCell><TableCell>{formatDateTime(voucher.expiredAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
          </>
        )}
        <Pagination page={query.data?.page ?? page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} />
      </div>
    </div>
  );
}
