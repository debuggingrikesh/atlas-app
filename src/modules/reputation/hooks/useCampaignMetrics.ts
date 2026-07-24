'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CampaignMetrics {
  overview: {
    totalRequests: number;
    deliveredRequests: number;
    openedRequests: number;
    expiredRequests: number;
  };
  outcomes: {
    positiveReviews: number;
    negativeFeedback: number;
    reviewConversionRate: number;
  };
  feedback: {
    unresolvedFeedback: number;
    resolvedFeedback: number;
    averageResolutionTime: number;
  };
  activity: {
    latestRequestCreatedAt: string | null;
    latestFeedbackCreatedAt: string | null;
  };
}

type MetricsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: CampaignMetrics }
  | { status: 'error'; message: string };

/**
 * Fetches campaign metrics from the B2 metrics endpoint.
 * Fetches once on mount; exposes a manual retry.
 */
export function useCampaignMetrics(campaignId: string, businessId: string) {
  const [state, setState] = useState<MetricsState>({ status: 'loading' });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();
    
    async function fetchMetrics() {
      try {
        const url = `/api/reputation/campaigns/${campaignId}/metrics?businessId=${encodeURIComponent(businessId)}`;
        const res = await fetch(url, { cache: 'no-store', signal: abortController.signal });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!abortController.signal.aborted) {
            setState({
              status: 'error',
              message: body?.error?.message ?? 'Failed to load campaign metrics.',
            });
          }
          return;
        }
        const json = await res.json();
        if (!abortController.signal.aborted) {
          setState({ status: 'success', data: json.data.metrics as CampaignMetrics });
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError' && !abortController.signal.aborted) {
          setState({ status: 'error', message: 'Network error. Please try again.' });
        }
      }
    }

    void fetchMetrics();

    return () => {
      abortController.abort();
    };
  }, [campaignId, businessId, retryCount]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRetryCount(c => c + 1);
  }, []);

  return { state, retry };
}
