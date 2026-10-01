"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/features/auth/use-session";
import { bookingKeys, bookingsApi } from "./api";
import { concertKeys } from "@/features/concerts/api";
import { errorMessage } from "@/lib/api-client";
import { formatVnd } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import type { TicketType } from "@/types/api";

export function TicketSelector({ concertId, tickets }: { concertId: number; tickets: TicketType[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isPending: sessionPending } = useSession();
  const hydrated = useHydrated();
  const visibleUser = hydrated ? user : undefined;
  const visibleSessionPending = !hydrated || sessionPending;
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [voucherCode, setVoucherCode] = useState("");
  const intentKey = useRef<string | null>(null);
  const totalCount = Object.values(quantities).reduce((sum, value) => sum + value, 0);
  const subtotal = useMemo(() => tickets.reduce((sum, ticket) => sum + Number(ticket.price) * (quantities[ticket.id] ?? 0), 0), [quantities, tickets]);

  const mutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: async (booking) => {
      intentKey.current = null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bookingKeys.history }),
        queryClient.invalidateQueries({ queryKey: concertKeys.tickets(concertId) }),
      ]);
      toast.success("Your tickets are reserved.");
      router.push(`/bookings/${booking.id}`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function change(ticket: TicketType, delta: number) {
    setQuantities((current) => {
      const next = Math.max(0, Math.min(ticket.remainingQuantity, (current[ticket.id] ?? 0) + delta));
      const otherCount = totalCount - (current[ticket.id] ?? 0);
      if (otherCount + next > 4) return current;
      if (next === (current[ticket.id] ?? 0)) return current;
      intentKey.current = null;
      return { ...current, [ticket.id]: next };
    });
  }

  function changeVoucher(value: string) {
    intentKey.current = null;
    setVoucherCode(value);
  }

  function reserve() {
    if (!visibleUser) {
      router.push(`/login?next=${encodeURIComponent(`/concerts/${concertId}`)}`);
      return;
    }
    if (totalCount < 1 || totalCount > 4) {
      toast.error("Choose between 1 and 4 tickets.");
      return;
    }
    intentKey.current ??= crypto.randomUUID();
    mutation.mutate({
      concertId,
      items: Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([ticketTypeId, quantity]) => ({ ticketTypeId: Number(ticketTypeId), quantity })),
      voucherCode: voucherCode.trim() || undefined,
      idempotencyKey: intentKey.current,
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Choose tickets</h2><p className="text-sm text-muted-foreground">Maximum 4 tickets per booking</p></div><ShoppingBag className="text-primary" /></div>
      <div className="space-y-3">
        {tickets.map((ticket) => {
          const quantity = quantities[ticket.id] ?? 0;
          return (
            <div key={ticket.id} className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div><p className="font-medium">{ticket.name}</p><p className="text-sm font-semibold text-primary">{formatVnd(ticket.price)}</p><p className="text-xs text-muted-foreground">{ticket.remainingQuantity} remaining</p></div>
              <div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label={`Remove ${ticket.name}`} disabled={quantity === 0} onClick={() => change(ticket, -1)}><Minus /></Button><span className="w-6 text-center font-semibold" aria-live="polite">{quantity}</span><Button size="icon" variant="outline" aria-label={`Add ${ticket.name}`} disabled={ticket.remainingQuantity === 0 || totalCount >= 4} onClick={() => change(ticket, 1)}><Plus /></Button></div>
            </div>
          );
        })}
      </div>
      <label className="mt-5 block text-sm font-medium">Voucher code <span className="font-normal text-muted-foreground">(optional)</span><Input className="mt-2 uppercase" value={voucherCode} onChange={(e) => changeVoucher(e.target.value)} placeholder="PUTNOW10" /></label>
      <Separator className="my-5" />
      <div className="mb-5 flex items-end justify-between"><div><p className="text-sm text-muted-foreground">Subtotal</p><p className="text-xs text-muted-foreground">Discount is confirmed by the server</p></div><p className="text-2xl font-bold">{formatVnd(subtotal)}</p></div>
      <Button className="h-11 w-full" disabled={mutation.isPending || visibleSessionPending || !tickets.length} onClick={reserve}>{mutation.isPending ? "Reserving…" : visibleUser ? "Reserve tickets" : "Sign in to reserve"}</Button>
      {!visibleUser && !visibleSessionPending && <p className="mt-3 text-center text-xs text-muted-foreground">New here? <Link className="text-primary hover:underline" href="/register">Create an account</Link></p>}
    </div>
  );
}
