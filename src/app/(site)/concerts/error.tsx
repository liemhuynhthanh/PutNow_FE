"use client";

import { ErrorState } from "@/components/page-state";

export default function ConcertsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <ErrorState message="Concerts could not be loaded. Check that the API is running and try again." retry={reset} />
    </div>
  );
}

