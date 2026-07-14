import React from 'react';
import { Button } from '@/components/ui/button';

interface ThankYouScreenProps {
  action: 'GOOGLE_REDIRECT' | 'INTERNAL_FEEDBACK_SAVED';
  redirectUrl?: string;
}

export function ThankYouScreen({ action, redirectUrl }: ThankYouScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in zoom-in-95 duration-500 py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {action === 'GOOGLE_REDIRECT' 
            ? 'Thank you for your feedback!' 
            : 'Thank you for helping us improve.'}
        </h2>
        <p className="text-muted-foreground">
          {action === 'GOOGLE_REDIRECT' 
            ? 'We are thrilled to hear you had a great experience.' 
            : 'Your feedback has been securely sent to our team.'}
        </p>
      </div>

      {action === 'GOOGLE_REDIRECT' && redirectUrl && (
        <a 
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto"
        >
          <Button size="lg" className="w-full sm:w-auto mt-4">
            Leave us a Google Review
          </Button>
        </a>
      )}
    </div>
  );
}
