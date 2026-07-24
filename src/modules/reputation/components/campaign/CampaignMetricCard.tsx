import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CampaignMetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

/**
 * Reusable metric card used throughout the Campaign Dashboard.
 * Follows the existing OverviewCards visual language.
 */
export function CampaignMetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary bg-primary/10',
  className,
}: CampaignMetricCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">
              {title}
            </p>
            <p
              className="mt-1.5 text-2xl font-bold text-foreground tabular-nums"
              aria-label={`${title}: ${value}`}
            >
              {value}
            </p>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{description}</p>
            )}
          </div>
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              iconColor,
            )}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Skeleton placeholder matching CampaignMetricCard dimensions */
export function CampaignMetricCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
