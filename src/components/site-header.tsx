"use client";

import { LogOut, Menu, Shield, TicketCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authApi } from "@/features/auth/api";
import { sessionKey, useSession } from "@/features/auth/use-session";
import { cn } from "@/lib/utils";

const links = [
  { href: "/concerts", label: "Concerts" },
  { href: "/bookings", label: "My bookings", protected: true },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useSession();
  const [open, setOpen] = useState(false);

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      queryClient.setQueryData(sessionKey, null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "concerts" });
      setOpen(false);
      toast.success("You have been signed out.");
      router.push("/");
    }
  }

  function navigation(mobile = false) {
    return links.filter((link) => !link.protected || user).map((link) => (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => mobile && setOpen(false)}
        aria-current={pathname.startsWith(link.href) ? "page" : undefined}
        className={cn(
          "rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          mobile && "min-h-11 px-4 text-base",
          pathname.startsWith(link.href) && "bg-accent text-foreground",
        )}
      >
        {link.label}
      </Link>
    ));
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">{navigation()}</nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              {user.role === "ADMIN" && <Button variant="outline" asChild><Link href="/admin"><Shield aria-hidden="true" />Admin</Link></Button>}
              <Button variant="ghost" asChild><Link href="/account"><UserRound aria-hidden="true" />{user.name}</Link></Button>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={logout}><LogOut aria-hidden="true" /></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
              <Button asChild><Link href="/register">Create account</Link></Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button className="md:hidden" variant="ghost" size="icon" aria-label="Open navigation menu" />}>
            <Menu aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(88vw,360px)]">
            <SheetHeader className="border-b p-6">
              <SheetTitle className="text-2xl uppercase">PutNow menu</SheetTitle>
              <SheetDescription>Concerts, bookings, and your account.</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4" aria-label="Mobile navigation">{navigation(true)}</nav>
            <div className="mt-auto space-y-3 border-t p-4">
              <div className="flex items-center justify-between"><span className="text-sm font-medium">Appearance</span><ThemeToggle /></div>
              {user ? (
                <>
                  <Button className="w-full justify-start" variant="outline" asChild><Link href="/account" onClick={() => setOpen(false)}><TicketCheck aria-hidden="true" />Account</Link></Button>
                  {user.role === "ADMIN" && <Button className="w-full justify-start" variant="outline" asChild><Link href="/admin" onClick={() => setOpen(false)}><Shield aria-hidden="true" />Admin</Link></Button>}
                  <Button className="w-full justify-start" variant="ghost" onClick={logout}><LogOut aria-hidden="true" />Sign out</Button>
                </>
              ) : (
                <div className="grid gap-2"><Button variant="outline" asChild><Link href="/login" onClick={() => setOpen(false)}>Sign in</Link></Button><Button asChild><Link href="/register" onClick={() => setOpen(false)}>Create account</Link></Button></div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
