import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Send, InboxIcon } from 'lucide-react';

interface CampaignEmptyStateProps {
  /** Base path of the reputation section, e.g. /dashboard/acme/reputation */
  reputationBasePath: string;
}

/**
 * Shown when a campaign has no activity (zero requests sent).
 * Provides a CTA to navigate to the review requests section.
 */
export function CampaignEmptyState({ reputationBasePath }: CampaignEmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center text-center space-y-4 max-w-sm mx-auto">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-muted"
            aria-hidden="true"
          >
            <InboxIcon className="h-7 w-7 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-semibold">No review requests yet</h2>
            <p className="text-sm text-muted-foreground">
              No review requests have been sent for this campaign. Send the first one to start
              collecting feedback.
            </p>
          </div>

          <Link href={`${reputationBasePath}/requests`} className={buttonVariants({ size: 'sm', className: 'gap-2' })}>
            <Send className="h-4 w-4" aria-hidden="true" />
            Send First Review Request
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
