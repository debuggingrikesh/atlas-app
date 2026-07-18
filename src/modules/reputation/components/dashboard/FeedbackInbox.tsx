'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, Eye, Sparkles, Inbox, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  createdAt: Date | string;
  aiResponses?: {
    id: string;
    generatedText: string;
    toneUsed: string;
    status: string;
  }[];
}

interface FeedbackInboxProps {
  initialFeedback: Feedback[];
  businessId: string;
  canManage: boolean;
  canGenerateAIResponse?: boolean;
}

export function FeedbackInbox({ initialFeedback, businessId, canManage, canGenerateAIResponse }: FeedbackInboxProps) {
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

  const handleGenerateAI = async (feedbackId: string) => {
    setGeneratingFor(feedbackId);
    try {
      const response = await fetch(`/api/reputation/feedback/${feedbackId}/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate AI response');

      // Update the specific feedback item with the new AI response
      setFeedbacks(prev => prev.map(f => {
        if (f.id === feedbackId) {
          return {
            ...f,
            aiResponses: [data.data || { generatedText: data.generatedText }] // Handle both API response formats
          };
        }
        return f;
      }));
      toast.success('AI draft generated successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setGeneratingFor(null);
    }
  };

  const renderAIResponse = (feedback: Feedback) => {
    const aiResponse = feedback.aiResponses?.[0];
    if (!aiResponse) return null;

    let parsedContent;
    let isNegativeAnalysis = false;

    try {
      // Check if it's our JSON structure for negative reviews
      if (aiResponse.generatedText.trim().startsWith('{')) {
        parsedContent = JSON.parse(aiResponse.generatedText);
        isNegativeAnalysis = !!parsedContent.sentiment;
      }
    } catch {
      // It's a plain text positive response draft
    }

    if (isNegativeAnalysis && parsedContent) {
      return (
        <div className="mt-4 p-4 rounded-lg bg-orange-50/50 border border-orange-100">
          <div className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> AI Reputation Analysis
          </div>
          <div className="space-y-2 text-sm text-orange-900/90">
            <div className="grid grid-cols-[120px_1fr] gap-1">
              <span className="font-medium opacity-80">Sentiment:</span>
              <span>{parsedContent.sentiment}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-1">
              <span className="font-medium opacity-80">Emotion:</span>
              <span>{parsedContent.customerEmotion}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-1">
              <span className="font-medium opacity-80">Main Issue:</span>
              <span>{parsedContent.mainIssue}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-1">
              <span className="font-medium opacity-80">Action:</span>
              <span className="font-medium">{parsedContent.recommendedAction}</span>
            </div>
            
            <div className="mt-4 pt-3 border-t border-orange-200/50">
              <div className="font-medium opacity-80 mb-1">Suggested Reply:</div>
              <div className="bg-white/60 p-3 rounded italic">
                {parsedContent.suggestedResponse}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default positive draft format
    return (
      <div className="mt-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
        <div className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> AI Suggested Reply
        </div>
        <div className="text-sm text-blue-900/90 whitespace-pre-wrap">
          {aiResponse.generatedText}
        </div>
      </div>
    );
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
                {canGenerateAIResponse && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleGenerateAI(feedback.id)}
                    disabled={generatingFor === feedback.id}
                  >
                    {generatingFor === feedback.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {generatingFor === feedback.id ? 'Generating...' : 'Regenerate AI Reply'}
                  </Button>
                )}
              </div>

              {/* AI Draft Section */}
              {renderAIResponse(feedback)}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
