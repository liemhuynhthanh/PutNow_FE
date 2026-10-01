import { CalendarDays, MapPin, Music2 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/page-state";
import { TicketSelector } from "@/features/bookings/ticket-selector";
import { formatDateTime } from "@/lib/format";
import { getPublicConcert, getPublicTicketTypes, PublicApiError } from "@/lib/server-api";

export const dynamic = "force-dynamic";

const getConcert = cache(getPublicConcert);

function cloudinaryImage(url?: string) {
  return url?.startsWith("https://res.cloudinary.com/") ? url : null;
}

export async function generateMetadata({ params }: PageProps<"/concerts/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const concert = await getConcert(Number(id));
    return {
      title: concert.title,
      description: concert.description || `View tickets and details for ${concert.title}.`,
      openGraph: cloudinaryImage(concert.imageUrl) ? { images: [concert.imageUrl!] } : undefined,
    };
  } catch {
    return { title: "Concert not found" };
  }
}

export default async function ConcertDetailPage({ params }: PageProps<"/concerts/[id]">) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) notFound();

  let concert;
  try {
    concert = await getConcert(id);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) notFound();
    throw error;
  }
  const tickets = await getPublicTicketTypes(id);
  const imageUrl = cloudinaryImage(concert.imageUrl);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid overflow-hidden rounded-xl border bg-card shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
        <div className="relative min-h-80 bg-accent lg:min-h-[540px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${concert.title} concert poster`}
              fill
              priority
              loading="eager"
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full min-h-80 place-items-center p-10 text-center font-heading text-5xl font-bold uppercase text-accent-foreground">
              {concert.title}
            </div>
          )}
        </div>
        <div className="flex flex-col p-6 sm:p-10 lg:p-12">
          <StatusBadge status={concert.status} />
          <h1 className="mt-5 text-5xl font-bold uppercase leading-[0.92] tracking-tight sm:text-6xl">
            {concert.title}
          </h1>
          <div className="mt-8 grid gap-5 border-y py-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="flex gap-3"><CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date and time</p><p className="mt-1 font-semibold">{formatDateTime(concert.startTime)}</p></div></div>
            <div className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Venue</p><p className="mt-1 font-semibold">Announced by organizer</p></div></div>
          </div>
          <section className="mt-7">
            <h2 className="flex items-center gap-2 text-2xl font-semibold uppercase"><Music2 className="size-5 text-primary" aria-hidden="true" />About the show</h2>
            <p className="mt-3 max-w-2xl whitespace-pre-wrap leading-7 text-muted-foreground">{concert.description || "More details will be announced soon."}</p>
          </section>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-xl border bg-card p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Ticket notes</p>
          <h2 className="mt-2 text-3xl font-semibold uppercase">Choose the right place in the room</h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Availability is checked again by the server when you reserve. A pending reservation is held for 15 minutes.</p>
        </section>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {tickets.length ? <TicketSelector concertId={id} tickets={tickets} /> : <EmptyState title="Tickets unavailable" description="Ticket types have not been released yet." />}
        </aside>
      </div>
    </div>
  );
}
