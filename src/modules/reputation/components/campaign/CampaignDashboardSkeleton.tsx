import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignMetricCardSkeleton } from './CampaignMetricCard';

/**
 * Full-page skeleton for the Campaign Dashboard.
 * Mirrors the real layout to prevent layout shift during load.
 */
export function CampaignDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading campaign dashboard">
      {/* Header skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            {/* Quick actions skeleton */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-md" />
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metrics section */}
      <div>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CampaignMetricCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="h-5 w-40 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CampaignMetricCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="h-5 w-36 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CampaignMetricCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Activity section skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
