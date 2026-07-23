 

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UsageMeterProps {
  businessSlug: string;
  usage: {
    count: number;
    limit: number;
  };
}

export function UsageMeter({ usage, businessSlug }: UsageMeterProps) {
  const percentage = Math.min(100, Math.round((usage.count / usage.limit) * 100));
  const isLimitReached = usage.count >= usage.limit;

  return (
    <Card className="p-6 h-full flex flex-col justify-between border border-border bg-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Campaign Usage</h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
            Free Plan
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You are on the free tier. Review requests sent are monitored against your lifetime limit.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex justify-between text-sm font-medium">
          <span>Review Requests Sent</span>
          <span className={isLimitReached ? 'text-destructive font-bold' : 'text-foreground'}>
            {usage.count} / {usage.limit}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${
              isLimitReached ? 'bg-destructive' : 'bg-primary'
            }`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            {isLimitReached 
              ? 'You have reached your free lifetime limit. Upgrade your plan to continue sending requests.' 
              : `You have ${usage.limit - usage.count} review requests remaining.`}
          </p>
          {isLimitReached && (
            <Link href={`/dashboard/${businessSlug}/settings/subscription`}>
              <Button size="sm" className="w-full">Upgrade to Pro</Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
