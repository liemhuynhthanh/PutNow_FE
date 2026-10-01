"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error(error); }, [error]); return <div className="grid min-h-[70vh] place-items-center px-4 text-center"><div><h1 className="text-3xl font-bold">Something went wrong</h1><p className="mt-3 text-muted-foreground">The page could not be displayed.</p><Button className="mt-6" onClick={reset}>Try again</Button></div></div>; }
