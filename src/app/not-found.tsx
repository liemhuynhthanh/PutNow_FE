import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() { return <div className="grid min-h-[70vh] place-items-center px-4 text-center"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p><h1 className="mt-3 text-4xl font-bold">This page left the venue</h1><p className="mt-3 text-muted-foreground">The page you requested could not be found.</p><Button className="mt-6" asChild><Link href="/">Back home</Link></Button></div></div>; }
