'use client';

import React from 'react';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FeedbackFormProps {
  onSubmit: (data: { comment: string; customerName: string; customerEmail: string; customerPhone: string }) => void;
  isSubmitting: boolean;
}

export function FeedbackForm({ onSubmit, isSubmitting }: FeedbackFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      comment: formData.get('comment') as string,
      customerName: formData.get('customerName') as string,
      customerEmail: formData.get('customerEmail') as string,
      customerPhone: formData.get('customerPhone') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="comment">Care to tell us more? (Optional)</Label>
          <textarea
            id="comment"
            name="comment"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Tell us about your experience..."
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-4 pt-2">
          <p className="text-sm font-medium text-muted-foreground">Your Details (Optional)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Name</Label>
              <Input id="customerName" name="customerName" disabled={isSubmitting} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input id="customerEmail" name="customerEmail" type="email" disabled={isSubmitting} placeholder="jane@example.com" />
            </div>
          </div>
          <div className="space-y-2 sm:w-1/2 sm:pr-2">
            <Label htmlFor="customerPhone">Phone Number</Label>
            <Input id="customerPhone" name="customerPhone" type="tel" disabled={isSubmitting} placeholder="+1 555-0123" />
          </div>
        </div>
      </div>

      <LoadingButton type="submit" className="w-full" size="lg" disabled={isSubmitting} isLoading={isSubmitting} loadingText="Submitting...">
        Submit Feedback
      </LoadingButton>
    </form>
  );
}
