"use client";

import { CalendarDays, Gauge, LogOut, Menu, ReceiptText, Tags, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RequireRole } from "@/features/auth/require-role";
import { authApi } from "@/features/auth/api";
import { sessionKey } from "@/features/auth/use-session";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Overview", icon: Gauge, exact: true },
  { href: "/admin/concerts", label: "Concerts", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: ReceiptText },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/vouchers", label: "Vouchers", icon: Tags },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function logout() {
    try { await authApi.logout(); }
    finally { queryClient.setQueryData(sessionKey, null); setOpen(false); router.replace("/login"); }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="p-5"><Logo /></div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Admin navigation">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground")}><Icon aria-hidden="true" className="size-4" />{label}</Link>;
        })}
      </nav>
      <div className="border-t p-3"><Button className="w-full justify-start" variant="ghost" onClick={logout}><LogOut aria-hidden="true" />Sign out</Button></div>
    </div>
  );

  return (
    <RequireRole role="ADMIN">
      <div className="min-h-screen bg-muted/30">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-sidebar lg:block">{sidebar}</aside>
        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger render={<Button className="lg:hidden" variant="ghost" size="icon" aria-label="Open admin navigation" />}><Menu aria-hidden="true" /></SheetTrigger>
                <SheetContent side="left" className="w-[min(88vw,288px)] p-0">
                  <SheetHeader className="sr-only"><SheetTitle>Admin navigation</SheetTitle><SheetDescription>Navigate PutNow administration.</SheetDescription></SheetHeader>
                  {sidebar}
                </SheetContent>
              </Sheet>
              <p className="font-semibold">Admin workspace</p>
            </div>
            <ThemeToggle />
          </header>
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </RequireRole>
  );
}
