import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import type { Concert, PageResponse } from "@/types/api";
import { ConcertCard } from "./concert-card";

type Filters = { keyword?: string; status?: string };

function pageHref(page: number, filters: Filters) {
  const search = new URLSearchParams();
  if (filters.keyword) search.set("keyword", filters.keyword);
  if (filters.status) search.set("status", filters.status);
  if (page > 0) search.set("page", String(page));
  const query = search.toString();
  return query ? `/concerts?${query}` : "/concerts";
}

export function ConcertList({
  data,
  filters = {},
  showPagination = true,
}: {
  data: PageResponse<Concert>;
  filters?: Filters;
  showPagination?: boolean;
}) {
  if (!data.items.length) {
    return <EmptyState title="No concerts found" description="Try another search or check back soon for new shows." />;
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((concert, index) => <ConcertCard key={concert.id} concert={concert} eager={index === 0} />)}
      </div>
      {showPagination && data.totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between border-t pt-6" aria-label="Concert pages">
          <Button variant="outline" asChild={data.page > 0} disabled={data.page === 0}>
            {data.page > 0 ? <Link href={pageHref(data.page - 1, filters)}><ChevronLeft aria-hidden="true" />Previous</Link> : <span><ChevronLeft aria-hidden="true" />Previous</span>}
          </Button>
          <p className="text-sm text-muted-foreground">Page <span className="font-semibold text-foreground tabular-nums">{data.page + 1}</span> of {data.totalPages}</p>
          <Button variant="outline" asChild={data.page + 1 < data.totalPages} disabled={data.page + 1 >= data.totalPages}>
            {data.page + 1 < data.totalPages ? <Link href={pageHref(data.page + 1, filters)}>Next<ChevronRight aria-hidden="true" /></Link> : <span>Next<ChevronRight aria-hidden="true" /></span>}
          </Button>
        </nav>
      )}
    </>
  );
}
