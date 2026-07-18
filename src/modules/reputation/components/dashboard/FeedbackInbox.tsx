'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, Eye, Sparkles, Inbox } from 'lucide-react';
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
  const [aiDrafts, setAiDrafts] = useState<Record<string, string>>({});

  const handleUpdateStatus = async (feedbackId: string, newStatus: 'REVIEWED' | 'RESOLVED') => {
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
      toast.success(`Feedback marked as ${newStatus}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  const handleGenerateAI = async (feedbackId: string) => {
    setGeneratingFor(feedbackId);
    try {
      const response = await fetch(`/api/reputation/feedback/${feedbackId}/generate-response`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate AI response');

      setAiDrafts(prev => ({ ...prev, [feedbackId]: data.generatedText }));
      toast.success('AI draft generated successfully');
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
                    >
                      <Eye className="h-3 w-3" />
                      Mark Reviewed
                    </Button>
                  )}

                  {canManage && feedback.status !== 'RESOLVED' && (
                    <Button
                      onClick={() => handleUpdateStatus(feedback.id, 'RESOLVED')}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Resolve
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
                    <Sparkles className="h-3 w-3" />
                    {generatingFor === feedback.id ? 'Generating...' : 'Generate AI Reply'}
                  </Button>
                )}
              </div>

              {/* AI Draft Section */}
              {aiDrafts[feedback.id] && (
                <div className="mt-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> AI Draft Response
                  </div>
                  <div className="text-sm text-blue-900/90 whitespace-pre-wrap">
                    {aiDrafts[feedback.id]}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
