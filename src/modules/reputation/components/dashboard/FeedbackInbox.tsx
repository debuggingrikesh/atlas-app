'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, Eye, Sparkles, Inbox, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FeedbackIntelligenceCard } from './FeedbackIntelligenceCard';
import { FeedbackAnalysisOutput } from '@/modules/ai/types/ai-types';

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  createdAt: Date | string;
  analyses?: {
    id: string;
    analysisData: FeedbackAnalysisOutput;
    status: string;
  }[];
}

interface FeedbackInboxProps {
  initialFeedback: Feedback[];
  businessId: string;
  businessSlug: string;
  canManage: boolean;
  isOwner: boolean;
  isPro: boolean;
}

export function FeedbackInbox({ initialFeedback, businessId, businessSlug, canManage, isOwner, isPro }: FeedbackInboxProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedback);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleUpdateStatus = async (feedbackId: string, newStatus: 'REVIEWED' | 'RESOLVED') => {
    setUpdatingStatus(`${feedbackId}-${newStatus}`);
    try {
      const response = await fetch(`/api/reputation/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update feedback status');

      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status: newStatus } : f));
      toast.success(`Feedback marked as ${newStatus.toLowerCase()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAnalyzeFeedback = async (feedbackId: string) => {
    setGeneratingFor(feedbackId);
    try {
      const response = await fetch(`/api/reputation/feedback/${feedbackId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to analyze feedback');

      // Update the specific feedback item with the new AI intelligence
      setFeedbacks(prev => prev.map(f => {
        if (f.id === feedbackId) {
          const analysisResult = data.data || data.response;
          return {
            ...f,
            analyses: [analysisResult]
          };
        }
        return f;
      }));
      toast.success('Reputation Intelligence generated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setGeneratingFor(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">Feedback Inbox</h3>

      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground border rounded-xl bg-card">
            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground/70" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Your inbox is empty</h3>
            <p className="text-sm max-w-sm">
              When customers submit feedback through your campaigns, it will appear here.
            </p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <Card key={feedback.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Rating & Customer Details */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${
                          s <= feedback.rating 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-muted'
                        }`}
                      />
                    ))}
                    <span className="text-sm font-semibold ml-2">({feedback.rating}/5)</span>
                  </div>
                  <div className="text-sm font-medium">
                    {feedback.customerName || 'Anonymous Customer'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {feedback.customerEmail || feedback.customerPhone || 'No contact details provided'}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={
                      feedback.status === 'RESOLVED' 
                        ? 'default' 
                        : feedback.status === 'REVIEWED' 
                        ? 'secondary' 
                        : 'outline'
                    }
                  >
                    {feedback.status}
                  </Badge>

                  {canManage && feedback.status === 'UNREAD' && (
                    <Button
                      onClick={() => handleUpdateStatus(feedback.id, 'REVIEWED')}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={updatingStatus !== null}
                    >
                      {updatingStatus === `${feedback.id}-REVIEWED` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      {updatingStatus === `${feedback.id}-REVIEWED` ? 'Updating...' : 'Mark Reviewed'}
                    </Button>
                  )}

                  {canManage && feedback.status !== 'RESOLVED' && (
                    <Button
                      onClick={() => handleUpdateStatus(feedback.id, 'RESOLVED')}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={updatingStatus !== null}
                    >
                      {updatingStatus === `${feedback.id}-RESOLVED` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {updatingStatus === `${feedback.id}-RESOLVED` ? 'Resolving...' : 'Resolve'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Feedback Comment */}
              {feedback.comment ? (
                <div className="text-sm bg-muted/30 p-4 rounded-lg border italic">
                  &ldquo;{feedback.comment}&rdquo;
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  No comment submitted.
                </div>
              )}

              {/* Date */}
              <div className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Submitted on {new Date(feedback.createdAt).toLocaleString()}</span>
                {isOwner && isPro && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleAnalyzeFeedback(feedback.id)}
                    disabled={generatingFor === feedback.id}
                  >
                    {generatingFor === feedback.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {generatingFor === feedback.id ? 'Analyzing...' : 'Generate Analysis'}
                  </Button>
                )}
                {isOwner && !isPro && (
                  <div className="text-xs font-medium text-primary px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    <span>Reputation Intelligence is available on Pro.</span>
                    <a href={`/dashboard/${businessSlug}/settings/subscription`} className="ml-2 underline font-semibold hover:text-primary/80">
                      Upgrade
                    </a>
                  </div>
                )}
              </div>

              {/* AI Intelligence Section */}
              {feedback.analyses?.[0] && (
                <FeedbackIntelligenceCard analysis={feedback.analyses[0].analysisData} />
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
