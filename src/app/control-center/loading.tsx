import { Skeleton } from "@/components/ui/skeleton";

export default function ControlCenterLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-4 w-[120px] mb-4" />
            <Skeleton className="h-8 w-[80px] mb-2" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm mt-4 p-6">
        <Skeleton className="h-6 w-[200px] mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
