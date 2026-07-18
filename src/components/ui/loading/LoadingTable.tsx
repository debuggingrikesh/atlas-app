import { Skeleton } from '@/components/ui/skeleton';

export function LoadingTable({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  return (
    <div className="w-full border rounded-md">
      {/* Header */}
      <div className="border-b flex items-center h-12 px-4 bg-muted/50 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rIndex) => (
          <div key={`r-${rIndex}`} className="flex items-center h-16 px-4 gap-4">
            {Array.from({ length: columns }).map((_, cIndex) => (
              <Skeleton key={`c-${cIndex}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
