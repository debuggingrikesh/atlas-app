 

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ReputationTabsProps {
  businessSlug: string;
  hasFeedbackViewPermission: boolean;
}

export function ReputationTabs({ businessSlug, hasFeedbackViewPermission }: ReputationTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Overview',
      href: `/dashboard/${businessSlug}/reputation`,
      exact: true,
    },
    {
      name: 'Campaigns',
      href: `/dashboard/${businessSlug}/reputation/campaigns`,
      exact: false,
    },
    {
      name: 'Review Requests',
      href: `/dashboard/${businessSlug}/reputation/requests`,
      exact: false,
    },
    ...(hasFeedbackViewPermission
      ? [
          {
            name: 'Feedback Inbox',
            href: `/dashboard/${businessSlug}/reputation/feedback`,
            exact: false,
          },
        ]
      : []),
  ];

  return (
    <div className="border-b border-border bg-background px-4">
      <div className="flex space-x-8">
        {tabs.map((tab) => {
          const isActive = tab.exact 
            ? pathname === tab.href 
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'border-b-2 py-4 text-sm font-medium transition-all hover:text-foreground/80',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground'
              )}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
