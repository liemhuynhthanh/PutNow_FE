import { ArrowUpRight, Radio, ShieldCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConcertList } from "@/features/concerts/concert-list";
import { getPublicConcerts } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const concerts = await getPublicConcerts({ page: 0, size: 6, status: "UPCOMING" });

  return (
    <>
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_330px]">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-primary">
                <Radio className="size-4" aria-hidden="true" /> Live music, clear booking
              </p>
              <h1 className="mt-5 max-w-5xl text-6xl font-bold uppercase leading-[0.88] tracking-[-0.035em] sm:text-7xl lg:text-8xl">
                Your next night<br /><span className="text-primary">starts here.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">
                Discover the shows people will talk about, compare every ticket tier, and reserve your place without the noise.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild><Link href="/concerts">Find a concert <ArrowUpRight aria-hidden="true" /></Link></Button>
                <Button size="lg" variant="outline" asChild><Link href="/register">Create an account</Link></Button>
              </div>
            </div>
            <aside className="border-l-4 border-primary bg-muted p-6" aria-label="Booking promise">
              <p className="font-heading text-2xl font-semibold uppercase">Built for the moment before the music</p>
              <div className="mt-6 space-y-5 text-sm">
                <p className="flex gap-3"><Ticket className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><span><strong className="block text-foreground">Know what remains</strong><span className="text-muted-foreground">Live ticket availability by tier.</span></span></p>
                <p className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><span><strong className="block text-foreground">Reserve with confidence</strong><span className="text-muted-foreground">Account-bound orders and clear status.</span></span></p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b pb-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">On sale now</p>
            <h2 className="mt-1 text-4xl font-bold uppercase sm:text-5xl">Concerts worth the countdown</h2>
          </div>
          <Button variant="ghost" asChild><Link href="/concerts">View the full lineup <ArrowUpRight aria-hidden="true" /></Link></Button>
        </div>
        <ConcertList data={concerts} showPagination={false} />
      </section>
    </>
  );
}
