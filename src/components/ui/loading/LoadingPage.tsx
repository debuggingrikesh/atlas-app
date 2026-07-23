/* eslint-disable @typescript-eslint/no-explicit-any */

import { Skeleton } from '@/components/ui/skeleton';

export function LoadingPage() {
  return (
    <div className="flex-1 space-y-6 p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="h-[400px] col-span-4 rounded-xl" />
        <Skeleton className="h-[400px] col-span-3 rounded-xl" />
      </div>
    </div>
  );
}
