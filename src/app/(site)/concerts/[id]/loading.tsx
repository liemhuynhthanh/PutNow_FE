import { Skeleton } from "@/components/ui/skeleton";

export default function ConcertDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading concert details">
      <Skeleton className="h-[34rem] rounded-xl" />
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]"><Skeleton className="h-52 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>
    </div>
  );
}
