import { Skeleton } from "@/components/ui/skeleton";

export default function ConcertsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading concerts">
      <Skeleton className="h-20 w-full max-w-xl" />
      <Skeleton className="my-8 h-20 w-full" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-80 rounded-xl" />)}
      </div>
    </div>
  );
}

