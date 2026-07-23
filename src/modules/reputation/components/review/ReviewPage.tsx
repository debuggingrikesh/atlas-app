/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { useState } from 'react';
import { BusinessHeader } from './BusinessHeader';
import { RatingSelector } from './RatingSelector';
import { FeedbackForm } from './FeedbackForm';
import { ThankYouScreen } from './ThankYouScreen';

interface ReviewPageProps {
  submitUrl: string;
  business: {
    name: string;
    logoUrl?: string | null;
  };
  campaign: {
    name: string;
  };
}

export function ReviewPage({ submitUrl, business }: ReviewPageProps) {
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [submitResult, setSubmitResult] = useState<{
    action: 'GOOGLE_REDIRECT' | 'INTERNAL_FEEDBACK_SAVED';
    redirectUrl?: string;
    comment?: string;
  } | null>(null);

  const handleSubmit = async (data: { comment: string; customerName: string; customerEmail: string; customerPhone: string; token?: string }) => {
    if (rating === 0) {
      setError('Please select a rating first.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, ...data }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to submit review');
      }

      setSubmitResult({
        action: result.data.action,
        redirectUrl: result.data.redirectUrl,
        comment: data.comment,
      });
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitResult) {
    return <ThankYouScreen action={submitResult.action} redirectUrl={submitResult.redirectUrl} userComment={submitResult.comment} />;
  }

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in duration-500">
      <BusinessHeader name={business.name} logoUrl={business.logoUrl} />
      
      <div className="space-y-8">
        <RatingSelector 
          rating={rating} 
          onRatingChange={(newRating) => {
            setRating(newRating);
            setError(null);
          }} 
          disabled={isSubmitting} 
        />
        
        {rating > 0 && (
          <FeedbackForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive animate-in slide-in-from-bottom-2">
          {error}
        </div>
      )}
    </div>
  );
}
