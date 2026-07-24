'use client';

import React, { useState, useMemo } from 'react';
import {
  Send,
  Inbox,
  Eye,
  Clock,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
  Timer,
  Activity,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CampaignMetricCard } from './CampaignMetricCard';
import { CampaignDashboardSkeleton } from './CampaignDashboardSkeleton';
import { CampaignEmptyState } from './CampaignEmptyState';
import { CampaignHeader } from './CampaignHeader';
import { useCampaignMetrics } from '@/modules/reputation/hooks/useCampaignMetrics';

interface Campaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  branch: { name: string } | null;
}

interface CampaignDashboardProps {
  campaign: Campaign;
  businessId: string;
  businessSlug: string;
  canManage: boolean;
}

function formatHours(hours: number): string {
  if (hours === 0) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Primary Campaign Dashboard client component.
 * Handles loading, error, empty, and populated states.
 */
export function CampaignDashboard({
  campaign,
  businessId,
  businessSlug,
  canManage,
}: CampaignDashboardProps) {
  const { state, retry } = useCampaignMetrics(campaign.id, businessId);
  const [campaignStatus, setCampaignStatus] = useState(campaign.status);

  const reputationBasePath = `/dashboard/${businessSlug}/reputation`;

  const isEmpty = useMemo(() => {
    if (state.status !== 'success') return false;
    return state.data.overview.totalRequests === 0;
  }, [state]);

  // ── Loading ──────────────────────────────────────────────────
  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div className="container p-6 space-y-6">
        <CampaignDashboardSkeleton />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (state.status === 'error') {
    return (
      <div className="container p-6 space-y-6">
        {/* Still render the header so the user can take quick actions */}
        <CampaignHeader
          campaign={{ ...campaign, status: campaignStatus }}
          businessId={businessId}
          businessSlug={businessSlug}
          canManage={canManage}
          onCampaignUpdated={(u) => setCampaignStatus(u.status)}
        />

        <Card>
          <CardContent className="py-10">
            <div
              className="flex flex-col items-center text-center space-y-4 max-w-sm mx-auto"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-destructive">
                  Failed to load metrics
                </p>
                <p className="text-xs text-muted-foreground">{state.message}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={retry}
                className="gap-2"
                aria-label="Retry loading campaign metrics"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────
  const { overview, outcomes, feedback, activity } = state.data;

  const overviewCards = [
    {
      title: 'Total Requests',
      value: overview.totalRequests,
      description: 'All requests created',
      icon: Send,
      iconColor: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Delivered',
      value: overview.deliveredRequests,
      description: `${overview.totalRequests > 0 ? Math.round((overview.deliveredRequests / overview.totalRequests) * 100) : 0}% of total`,
      icon: Inbox,
      iconColor: 'text-indigo-600 bg-indigo-100',
    },
    {
      title: 'Opened',
      value: overview.openedRequests,
      description: `${overview.deliveredRequests > 0 ? Math.round((overview.openedRequests / overview.deliveredRequests) * 100) : 0}% open rate`,
      icon: Eye,
      iconColor: 'text-violet-600 bg-violet-100',
    },
    {
      title: 'Expired',
      value: overview.expiredRequests,
      description: 'Requests past deadline',
      icon: Clock,
      iconColor: overview.expiredRequests > 0 ? 'text-amber-600 bg-amber-100' : 'text-muted-foreground bg-muted',
    },
  ];

  const reviewCards = [
    {
      title: 'Positive Reviews',
      value: outcomes.positiveReviews,
      description: 'Above rating threshold',
      icon: ThumbsUp,
      iconColor: 'text-green-600 bg-green-100',
    },
    {
      title: 'Negative Feedback',
      value: outcomes.negativeFeedback,
      description: 'Below rating threshold',
      icon: ThumbsDown,
      iconColor: outcomes.negativeFeedback > 0 ? 'text-red-600 bg-red-100' : 'text-muted-foreground bg-muted',
    },
    {
      title: 'Conversion Rate',
      value: `${outcomes.reviewConversionRate}%`,
      description: 'Requests that resulted in reviews',
      icon: TrendingUp,
      iconColor: 'text-emerald-600 bg-emerald-100',
    },
  ];

  const feedbackCards = [
    {
      title: 'Unresolved',
      value: feedback.unresolvedFeedback,
      description: 'Awaiting response',
      icon: MessageCircle,
      iconColor: feedback.unresolvedFeedback > 0 ? 'text-orange-600 bg-orange-100' : 'text-muted-foreground bg-muted',
    },
    {
      title: 'Resolved',
      value: feedback.resolvedFeedback,
      description: 'Closed feedback items',
      icon: CheckCircle2,
      iconColor: 'text-teal-600 bg-teal-100',
    },
    {
      title: 'Avg. Resolution Time',
      value: formatHours(feedback.averageResolutionTime),
      description: feedback.resolvedFeedback > 0 ? 'Time to resolve feedback' : 'No resolved feedback yet',
      icon: Timer,
      iconColor: 'text-sky-600 bg-sky-100',
    },
  ];

  return (
    <div className="container p-6 space-y-6">
      {/* Campaign Header */}
      <CampaignHeader
        campaign={{ ...campaign, status: campaignStatus }}
        businessId={businessId}
        businessSlug={businessSlug}
        canManage={canManage}
        onCampaignUpdated={(u) => setCampaignStatus(u.status)}
      />

      {/* Empty State */}
      {isEmpty ? (
        <CampaignEmptyState reputationBasePath={reputationBasePath} />
      ) : (
        <>
          {/* Overview Section */}
          <section aria-labelledby="section-overview">
            <h2 id="section-overview" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {overviewCards.map((card) => (
                <CampaignMetricCard key={card.title} {...card} />
              ))}
            </div>
          </section>

          {/* Review Performance Section */}
          <section aria-labelledby="section-review-performance">
            <h2 id="section-review-performance" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Review Performance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {reviewCards.map((card) => (
                <CampaignMetricCard key={card.title} {...card} />
              ))}
            </div>
          </section>

          {/* Feedback Section */}
          <section aria-labelledby="section-feedback">
            <h2 id="section-feedback" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Feedback
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {feedbackCards.map((card) => (
                <CampaignMetricCard key={card.title} {...card} />
              ))}
            </div>
          </section>

          {/* Activity Section */}
          <section aria-labelledby="section-activity">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                  <span className="text-muted-foreground">Latest request sent</span>
                  <time
                    className="font-medium"
                    dateTime={activity.latestRequestCreatedAt ?? undefined}
                    aria-label={`Latest request: ${formatTimestamp(activity.latestRequestCreatedAt)}`}
                  >
                    {formatTimestamp(activity.latestRequestCreatedAt)}
                  </time>
                </div>
                <div className="border-t border-border/40" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                  <span className="text-muted-foreground">Latest feedback received</span>
                  <time
                    className="font-medium"
                    dateTime={activity.latestFeedbackCreatedAt ?? undefined}
                    aria-label={`Latest feedback: ${formatTimestamp(activity.latestFeedbackCreatedAt)}`}
                  >
                    {formatTimestamp(activity.latestFeedbackCreatedAt)}
                  </time>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
