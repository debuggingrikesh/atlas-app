import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import type { Metadata } from 'next';
import { ReputationSummaryService } from '@/modules/reputation/services/reputation-summary-service';
import Link from 'next/link';

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { businessSlug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { name: true },
  });
  return {
    title: business ? `${business.name} — Dashboard` : 'Dashboard',
  };
}

export default async function DashboardPage({ params }: Props) {
  const { businessSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  // Verify the business exists and the user is a member
  const membership = await prisma.businessMember.findFirst({
    where: {
      userId: user.id,
      business: { slug: businessSlug },
    },
    include: {
      rbacRole: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      },
      business: {
        include: {
          industryTemplate: { select: { name: true } },
          branches: { where: { isActive: true }, select: { id: true, name: true, address: true } },
        },
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const { business } = membership;

  // Fetch reputation summary if permitted
  const reputationSummary = await ReputationSummaryService.getSummary(business.id, {
    ...business,
    role: membership.role,
    rbacRole: membership.rbacRole,
  });

  return (
    <div className="container px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <span>{business.industryTemplate.name}</span>
          <span>·</span>
          <span className="capitalize">{membership.role.toLowerCase()}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome to your dashboard.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Branches card */}
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Active Branches</p>
          <p className="mt-2 text-3xl font-bold">{business.branches.length}</p>
          <div className="mt-3 space-y-1">
            {business.branches.map((b) => (
              <div key={b.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <span>{b.name}{b.address ? ` — ${b.address}` : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reputation summary card */}
        {!reputationSummary ? (
          <div className="rounded-lg border bg-card p-6 flex flex-col justify-between opacity-80">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reputation Stats</p>
              <div className="mt-4 flex flex-col items-center justify-center text-center py-6">
                <p className="font-semibold text-foreground">Access Restricted</p>
                <p className="text-xs text-muted-foreground mt-1">You don&apos;t have permission to view reputation data.</p>
              </div>
            </div>
          </div>
        ) : reputationSummary.totalRequests === 0 ? (
          <div className="rounded-lg border bg-card p-6 flex flex-col justify-between col-span-1 lg:col-span-2">
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
        ) : (
          <div className="rounded-lg border bg-card p-6 flex flex-col justify-between lg:col-span-2">
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
        )}
      </div>
    </div>
  );
}
