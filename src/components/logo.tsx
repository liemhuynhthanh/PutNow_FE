import { Ticket } from "lucide-react";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Ticket className="size-5" />
      </span>
      {!compact && <span className="text-xl">PutNow</span>}
    </Link>
  );
}
