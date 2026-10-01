import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import type { Concert } from "@/types/api";

function cloudinaryImage(url?: string) {
  return url?.startsWith("https://res.cloudinary.com/") ? url : null;
}

export function ConcertCard({ concert, eager = false }: { concert: Concert; eager?: boolean }) {
  const date = new Date(concert.startTime);
  const imageUrl = cloudinaryImage(concert.imageUrl);

  return (
    <article className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg">
      <Link
        href={`/concerts/${concert.id}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`View ${concert.title}`}
      />
      <div className="grid min-h-64 grid-cols-[76px_1fr]">
        <div className="flex flex-col items-center border-r bg-muted px-2 py-5 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {date.toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="font-heading text-4xl font-bold tabular-nums">{date.getDate()}</span>
          <span className="mt-1 text-xs text-muted-foreground">{date.getFullYear()}</span>
          <span className="mt-auto"><CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" /></span>
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="relative aspect-[16/9] overflow-hidden bg-accent">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${concert.title} concert poster`}
                fill
                loading={eager ? "eager" : "lazy"}
                sizes="(max-width: 640px) 75vw, (max-width: 1024px) 40vw, 360px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="grid h-full place-items-center px-6 text-center font-heading text-2xl font-semibold text-accent-foreground">
                {concert.title}
              </div>
            )}
            <div className="absolute left-3 top-3"><StatusBadge status={concert.status} /></div>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="line-clamp-2 text-2xl font-semibold leading-tight group-hover:text-primary">
              {concert.title}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">{formatDateTime(concert.startTime)}</p>
            <p className="mt-auto flex items-center gap-2 pt-5 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden="true" /> Venue announced by organizer
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
