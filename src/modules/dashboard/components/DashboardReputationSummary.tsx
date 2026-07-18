import Link from 'next/link';
import { ReputationSummaryService } from '@/modules/reputation/services/reputation-summary-service';
import type { BusinessWithMembership } from '@/modules/business/types';

interface Props {
  business: BusinessWithMembership;
  businessSlug: string;
}

export async function DashboardReputationSummary({ business, businessSlug }: Props) {
  // Fetch reputation summary if permitted
  const reputationSummary = await ReputationSummaryService.getSummary(business.id, business);

  if (!reputationSummary) {
    return (
      <div className="rounded-lg border bg-card p-6 flex flex-col justify-between opacity-80 h-full">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Reputation Stats</p>
          <div className="mt-4 flex flex-col items-center justify-center text-center py-6">
            <p className="font-semibold text-foreground">Access Restricted</p>
            <p className="text-xs text-muted-foreground mt-1">You don&apos;t have permission to view reputation data.</p>
          </div>
        </div>
      </div>
    );
  }

  if (reputationSummary.totalRequests === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 flex flex-col justify-between col-span-1 lg:col-span-2 h-full">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Reputation Stats</p>
          <div className="mt-4 flex flex-col items-center justify-center text-center py-6 bg-muted/30 rounded-md border border-dashed">
            <p className="font-semibold text-foreground">Start collecting customer reviews</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">No customer feedback yet. Your customer responses will appear here.</p>
            <Link href={`/dashboard/${businessSlug}/reputation/campaigns`}>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                Create your first review request
              </button>
            </Link>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <Link 
            href={`/dashboard/${businessSlug}/reputation`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View Reputation Dashboard &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 flex flex-col justify-between lg:col-span-2 h-full">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Reputation Stats</p>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-3xl font-bold">{reputationSummary.completedRequests}</p>
            <p className="text-xs text-muted-foreground">Completed Reviews</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{reputationSummary.positiveFeedback}</p>
            <p className="text-xs text-muted-foreground">Positive Rating</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{reputationSummary.totalRequests}</p>
            <p className="text-xs text-muted-foreground">Requests Sent</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{reputationSummary.openedRequests}</p>
            <p className="text-xs text-muted-foreground">Requests Opened</p>
          </div>
        </div>
        {reputationSummary.privateFeedbackCount > 0 && (
          <p className="mt-4 text-xs font-medium text-amber-600 bg-amber-50 p-2 rounded-md inline-block">
            {reputationSummary.privateFeedbackCount} private feedback requires attention
          </p>
        )}
      </div>
      <div className="mt-4 pt-4 border-t">
        <Link 
          href={`/dashboard/${businessSlug}/reputation`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View Reputation Dashboard &rarr;
        </Link>
      </div>
    </div>
  );
}
