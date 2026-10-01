import { ConcertsView } from "./view";
import { ConcertList } from "@/features/concerts/concert-list";
import { getPublicConcerts } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Concerts",
  description: "Browse upcoming concerts and compare available ticket tiers on PutNow.",
};

export default async function ConcertsPage({ searchParams }: PageProps<"/concerts">) {
  const params = await searchParams;
  const keyword = typeof params.keyword === "string" ? params.keyword : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(0, Number(params.page ?? 0) || 0);
  const concerts = await getPublicConcerts({ keyword, status, page, size: 12 });
  return (
    <ConcertsView initialKeyword={keyword} initialStatus={status}>
      <ConcertList data={concerts} filters={{ keyword, status }} />
    </ConcertsView>
  );
}
